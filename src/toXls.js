const json2xls = require('json2xls')
const fs = require('fs-extra')
const {save, load, toName} = require('./io')

module.exports = async ({xlsName}) => {
  let details = await load('details')
  let data = Object.keys(details).map(id => details[id])
  let d = data.map(o => {
    o.salaryStart = (o.salary.split('-')[0] || "").replace('k', '')
    o.salaryEnd = (o.salary.split('-')[1] || "").replace('k', '')
    return o
  }).filter(o => {
    return o.title && o.salaryStart >= 15 && o.salaryEnd > 25
  })

  var xls = json2xls(d)

  let xlsPath = `../xls/${toName(xlsName)}.xlsx`
  await fs.ensureFile(xlsPath)
  fs.writeFileSync(xlsPath, xls, 'binary')
}