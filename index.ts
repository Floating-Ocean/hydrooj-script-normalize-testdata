import { streamToBuffer } from '@hydrooj/utils/lib/utils';
import {
    Context, DomainModel, ProblemModel, Schema, StorageModel,
} from 'hydrooj';
import { normalizeTestdata } from './normalize';

interface Args {
    domainId: string;
}

type Report = (message: { message: string }) => void;

function problemName(pdoc: { pid?: string, docId: number }) {
    return pdoc.pid || `P${pdoc.docId}`;
}

export async function apply(ctx: Context) {
    ctx.addScript(
        'normalizeTestdata',
        'Normalize all problem testdata',
        Schema.object({ domainId: Schema.string() }),
        async ({ domainId }: Args, report: Report) => {
            let problemCount = 0;
            let fileCount = 0;
            let changedCount = 0;
            const failures: string[] = [];
            const domains = domainId
                ? [domainId]
                : (await DomainModel.getMulti().project({ _id: 1 }).toArray()).map((domain) => domain._id);

            report({ message: `Found ${domains.length} domain${domains.length === 1 ? '' : 's'}.` });

            for (const domainId of domains) {
                const pdocs = await ProblemModel.getMulti(domainId, {}, ['docId', 'pid', 'title', 'data']).toArray();
                report({ message: `Domain ${domainId}: ${pdocs.length} problems found.` });

                for (const pdoc of pdocs) {
                    problemCount++;
                    for (const file of pdoc.data || []) {
                        fileCount++;

                        const path = `problem/${domainId}/${pdoc.docId}/testdata/${file.name}`;
                        try {
                            const originalBuffer = await streamToBuffer(await StorageModel.get(path));
                            let original: string;
                            try {
                                original = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(originalBuffer);
                            } catch {
                                report({ message: `${domainId}/${problemName(pdoc)}: skipped non-UTF-8 file ${file.name}` });
                                continue;
                            }
                            const normalized = normalizeTestdata(original);
                            if (normalized === original) continue;

                            await ProblemModel.addTestdata(domainId, pdoc.docId, file.name, Buffer.from(normalized), 1);
                            changedCount++;
                            report({ message: `${domainId}/${problemName(pdoc)}: normalized ${file.name}` });
                        } catch (error) {
                            const detail = error instanceof Error ? error.message : String(error);
                            failures.push(`${domainId}/${problemName(pdoc)}/${file.name}: ${detail}`);
                            report({ message: `${domainId}/${problemName(pdoc)}: failed ${file.name}: ${detail}` });
                        }
                    }
                }
            }

            report({ message: `Finished: ${problemCount} problems, ${fileCount} text files checked, ${changedCount} files changed.` });
            if (failures.length) throw new Error(`Failed to normalize ${failures.length} file(s): ${failures.join('; ')}`);
            return true;
        },
    )
    ctx.i18n.load('zh', {
        "Normalize all problem testdata": "规范化所有题目测试数据",
    });
}

export { normalizeTestdata } from './normalize';
