const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

async function pack () {
  const root = process.cwd()
  const params = ctx.task.getParams('pack')
  const _input = params.i || params.input || ''

  // -ignore=**/x/**
  let ignore = params.ignore ? params.ignore.split(',') : []
  ignore = Array.from(
    new Set(
      ignore.concat([
        '.DS_Store',
        '*/.DS_Store',
        '**/*/.DS_Store',
        '**/.git/**',
        '**/.svn/**'
      ])
    )
  )

  const input = ctx.utils.path.isAbsolute(_input)
    ? _input
    : path.join(root, _input)

  ctx.logger.log('Input:', input)

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

  const outputName = path.basename(inputArr.join('/'))
  const output = path.join(
    input === root ? path.dirname(root) : root,
    `${outputName}.zip`
  )
  ctx.logger.log('output:', output)

  let globPattern = input.replace(globRoot, '')
  if (globPattern.startsWith('/')) {
    globPattern = globPattern.replace('/', '')
  }
  globPattern = globPattern || '**/**'

  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(output)
    const archive = archiver('zip', {
      zlib: {
        level: 9
      }
    })

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

      ctx.logger.success(
        `Pack success. File Size: ${size.toFixed(2)} ${unit}`
      )
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
      ignore: ignore
    })

    archive.finalize()
  })
}

module.exports = pack
