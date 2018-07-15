const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const makeDir = require('make-dir')
const inquirer = require('inquirer')

const root = process.cwd()

const defaults = {
  input: root,
  output: '',
  ignore: [
    '.DS_Store',
    '*/.DS_Store',
    '**/*/.DS_Store',
    '**/.git/**',
    '**/.svn/**'
  ],
  formats: {
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
    gzip: {
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
}

async function parseInput (_input) {
  // -i=   -input=
  const input = path.isAbsolute(_input) ? _input : path.join(root, _input)

  const inputArr = input.split(path.sep)
  inputArr.reduceRight((prev, curr, index, array) => {
    if (!prev || prev.startsWith('*')) {
      array.pop()
    }
    return curr
  })
  const inputPath = inputArr.join(path.sep)

  if (!await ctx.utils.fs.exist(inputPath)) {
    ctx.logger.error(`'${inputPath}' not found.`)
    process.exit(1)
  }

  const inputStat = await ctx.utils.fs.stat(inputPath)
  const isFile = inputStat.isFile()
  const globRoot = isFile ? path.dirname(inputPath) : inputPath

  let globPattern = input.replace(globRoot, '')
  if (globPattern.startsWith(path.sep)) {
    globPattern = globPattern.replace(path.sep, '')
  }
  globPattern = globPattern || '**/**'

  return {
    input,
    inputArr,
    globRoot,
    globPattern
  }
}

async function parseOutput (input, inputArr, _output) {
  // -o=   -output=
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

function parseIgnore (_ignore) {
  // -ignore=**/x/**
  return Array.from(new Set(_ignore.concat(defaults.ignore)))
}

function parseFormat (_path, _format) {
  const fileExt = path.extname(_path)
  const fileName = _path ? fileExt.replace('.', '') : ''
  const name = _format || fileName || 'zip'

  const format = defaults.formats[name] || defaults.formats['zip']

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

async function pack (opts) {
  const { input, inputArr, globRoot, globPattern } = await parseInput(
    opts.input
  )
  let output = await parseOutput(input, inputArr, opts.output)
  const ignore = parseIgnore(opts.ignore)
  const { format, formatedOutput } = parseFormat(output, opts.format)
  ctx.logger.log('input :', input)
  ctx.logger.log('ignore:', ignore.join(','))
  ctx.logger.log('output:', formatedOutput)
  ctx.logger.log('Packing...')

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

async function start () {
  const params = ctx.task.getParams('pack')
  let format = params.f || params.format
  let input = params.i || params.input || ''
  let output = params.o || params.output || ''
  let ignore = params.ignore ? params.ignore.split(',') : []

  if (!input) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: 'Choose a format to continue',
        choices: Object.keys(defaults.formats),
        default: format || 'zip'
      },
      {
        type: 'input',
        name: 'input',
        message: 'Input',
        default: defaults.input
      },
      {
        type: 'input',
        name: 'output',
        message: 'Output',
        default: output || defaults.output
      },
      {
        type: 'input',
        name: 'ignore',
        message: 'Ignore',
        default: ignore.length > 0
          ? ignore.join(',')
          : defaults.ignore.join(',')
      }
    ])

    input = answers.input
    output = answers.output || ''
    ignore = answers.ignore.split(',')
    format = answers.format
  }

  await pack({
    format,
    input,
    output,
    ignore
  })
}

module.exports = start
