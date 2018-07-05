# fbi-task-pack
Pack files or folders.

> This is a fbi task. If you haven't installed [fbi](https://github.com/AlloyTeam/fbi) yet, use the following command to install.
>
> `$ npm i -g fbi` or `yarn global add fbi`

## Requirements
- `fbi v3.0+`
- `node v7.6+`

## Features

- pack files/folders with [archiver](https://github.com/archiverjs/node-archiver)

## Usage

**Install**

```bash
$ fbi add https://github.com/fbi-templates/fbi-task-pack.git
```

**Run**

```bash
$ cd path/to/any/directory
$ fbi pack
```

## Params

- `-i/-input`: Pattern to be matched. [docs](https://github.com/isaacs/node-glob#glob-primer)
  - example: `$ fbi pack -i=example/sub-folder`
- `-ignore`: A pattern or an array of glob patterns to exclude matches
  - defaults: `.DS_Store,*/.DS_Store,**/*/.DS_Store,**/.git/**,**/.svn/**`
  - example: `$ fbi pack -ignore=**/x/**,a.txt`

## More
- [Official templates](https://github.com/fbi-templates)
- [`fbi` documentation](https://neikvon.gitbooks.io/fbi/content/)

## License
[MIT](https://opensource.org/licenses/MIT)

## Changelog

- **1.0.0** (2018.07.06)
  - init
