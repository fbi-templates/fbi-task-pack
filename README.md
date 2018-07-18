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
- support `.zip`(default), `.tar`, `.tar.gz` formats
- support `input`, `output` options

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

- `-i/-input`: Pattern to be matched (absoulute or relative path) [docs](https://github.com/isaacs/node-glob#glob-primer)
  - optional: true
  - defaults: current directory
  - example:
    - `$ fbi pack -i=example/sub-folder`
- `-o/-ouput`: file path to output (absoulute or relative path)
  - optional: true
  - defaults: input's name
  - example:
    - `$ fbi pack -o=a.zip`
- `-f/-format`: archive format
  - optional: true
  - defaults: zip (can be 'zip', 'tar', 'gz')
  - example:
    - `$ fbi pack -f=tar`
- `-ignore`: A pattern or an array of glob patterns to exclude matches
  - optional: true
  - defaults: `.DS_Store,*/.DS_Store,**/*/.DS_Store,**/.git/**,**/.svn/**`
  - example:
    - `$ fbi pack -ignore=**/x/**,a.txt`

## More

- [Official templates](https://github.com/fbi-templates)
- [`fbi` documentation](https://neikvon.gitbooks.io/fbi/content/)

## License

[MIT](https://opensource.org/licenses/MIT)

## [Changelog](./CHANGELOG.md)
