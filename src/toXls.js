const json2xls = require('json2xls')
const fs = require('fs-extra')
const {save, load, toName} = require('./io')
const {log} = require('./utils')
const path = require('path')

module.exports = async ({xlsName}) => {
  let details = await load('details')
  let data = Object.keys(details).map(id => details[id])
  let d = data.map(o => {
    o.salaryStart = (o.salary.split('-')[0] || "").replace('k', '')
    o.salaryEnd = (o.salary.split('-')[1] || "").replace('k', '')
    return o
  }).filter(o => {
    return o.title
  })

  var xls = json2xls(d)

  let xlsPath = path.join(__dirname, '..', `xls/${toName(xlsName)}.xlsx`)
  await fs.ensureFile(xlsPath)
  await fs.writeFile(xlsPath, xls, 'binary')
}