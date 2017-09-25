const fs = require('fs-extra')
const path = require('path')

const {
  tmpFolder = '.tmp',
    type,
    city,
    stages,
    domains,
} = require('./config')

const {
  str
} = require('./utils')

const toName = name => `${name}_${type}${city}` //名称策略
const toPath = (name, type = 'json') => path.join(__dirname, '..', tmpFolder, `${toName(name)}.${type}`)

const load = async(name, defaultValue, type) => {
  await fs.ensureFile(toPath(name, type))
  try {
    let jsonStr = await fs.readFile(toPath(name, type), 'utf-8')
    if(!jsonStr) return defaultValue
    return JSON.parse(jsonStr)
  } catch (e) {
    console.log('err', e)
    return defaultValue
  }
}
const save = async(name, data, type) => {
  await fs.ensureFile(toPath(name, type))
  await fs.writeFile(toPath(name, type), str(data))
}

module.exports = {
  toName,
  toPath,
  load,
  save,
}