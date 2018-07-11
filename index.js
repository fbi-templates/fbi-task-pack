const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const makeDir = require('make-dir')

const root = process.cwd()
const params = ctx.task.getParams('pack')

async function parseInput () {
  // -i=   -input=
  const _input = params.i || params.input || ''
  const input = path.isAbsolute(_input) ? _input : path.join(root, _input)

  const inputArr = input.split('/')
  inputArr.reduceRight((prev, curr, index, array) => {
    if (!prev || prev.startsWith('*')) {
      array.pop()
    }
    return curr
  })
  const inputPath = inputArr.join('/')

  if (!await ctx.utils.fs.exist(inputPath)) {
    ctx.logger.error(`Input not found.`)
    process.exit(1)
  }

  const inputStat = await ctx.utils.fs.stat(inputPath)
  const isFile = inputStat.isFile()
  const globRoot = isFile ? path.dirname(inputPath) : inputPath

  let globPattern = input.replace(globRoot, '')
  if (globPattern.startsWith('/')) {
    globPattern = globPattern.replace('/', '')
  }
  globPattern = globPattern || '**/**'

  return {
    input,
    inputArr,
    globRoot,
    globPattern
  }
}

async function parseOutput (input, inputArr) {
  // -o=   -output=
  const _output = params.o || params.output || ''

  const output = _output
    ? path.isAbsolute(_output)
        ? _output
        : path.join(input === root ? path.dirname(root) : root, _output)
    : path.join(
        input === root ? path.dirname(root) : root,
        path.basename(inputArr.join('/'))
      )

  await makeDir(path.dirname(output))

  return output
}

function parseIgnore () {
  // -ignore=**/x/**
  const ignoreDefs = [
    '.DS_Store',
    '*/.DS_Store',
    '**/*/.DS_Store',
    '**/.git/**',
    '**/.svn/**'
  ]
  let ignore = params.ignore ? params.ignore.split(',') : []
  return Array.from(new Set(ignore.concat(ignoreDefs)))
}

function parseFormat (_path) {
  const inputParam = params.f || params.format
  const fileExt = path.extname(_path)
  const fileName = _path ? fileExt.replace('.', '') : ''
  const name = inputParam || fileName || 'zip'

  const formats = {
    zip: {
      name: 'zip',
      extname: 'zip',
      options: {
        zlib: {
          level: 9
        }
      }
    },
    tar: {
      name: 'tar',
      extname: 'tar',
      options: {}
    },
    gz: {
      name: 'tar',
      extname: 'tar.gz',
      options: {
        gzip: true,
        gzipOptions: {
          level: 1
        }
      }
    }
  }

  const format = formats[name] || formats['zip']

  let formatedOutput
  if (fileExt && fileExt === `.${format.extname}`) {
    formatedOutput = _path
  } else {
    formatedOutput = _path + '.' + format.extname
  }

  return {
    formatedOutput,
    format
  }
}

async function pack () {
  const { input, inputArr, globRoot, globPattern } = await parseInput()
  let output = await parseOutput(input, inputArr)
  const ignore = parseIgnore()
  const { format, formatedOutput } = parseFormat(output)
  ctx.logger.log('input:', input)
  ctx.logger.log('output:', formatedOutput)

  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(formatedOutput)
    const archive = archiver(format.name, format.options)

    ws.on('close', function () {
      let unit = 'bytes'
      let size = archive.pointer()
      if (size > 1000) {
        size = size / 1024
        unit = 'KB'
      }

      if (size > 1000) {
        size = size / 1024
        unit = 'MB'
      }

      if (size > 1000) {
        size = size / 1024
        unit = 'GB'
      }

      ctx.logger.success(`Pack success. File Size: ${size.toFixed(2)} ${unit}`)
      resolve()
    })

    ws.on('end', function () {
      console.log('Data has been drained')
    })

    archive.on('warning', function (err) {
      reject(err)
    })

    archive.on('error', function (err) {
      reject(err)
    })

    archive.pipe(ws)

    archive.glob(globPattern, {
      cwd: globRoot,
      nomount: true,
      dot: true,
      debug: !!ctx.mode.debug,
      absolute: false,
      ignore
    })

    archive.finalize()
  })
}

module.exports = pack
