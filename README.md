# hydrooj-script-normalize-testdata

A HydroOJ script plugin for normalizing problem testdata files.

For every testdata file in one domain or all domains, the script:

- converts `CRLF` and `CR` to `LF`;
- removes spaces and tabs at the end of each line;
- ensures the file ends with exactly the newline required by its content;
- skips files that are not valid UTF-8;
- only writes files whose content changed.

## Install

Install the package as a Hydro addon, then restart Hydro:

```sh
hydrooj addon add /path/to/hydrooj-script-normalize-testdata
```
