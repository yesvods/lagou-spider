const fs = require('fs-extra')
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const _ = require('lodash')
const pQueue = require('p-queue')
const pRetry = require('p-retry')

const {
  log,
  toArray,
  str
} = require('./utils')
const {
  load,
  save,
} = require('./io')

const filterStr = str => {
  return str.trim().replace(/\n(\s)+/g, '')
}

const grapDetail = (content, id) => {
  const $ = cheerio.load(content)
  let title = $('.job-name').text()
  let salary = $('.job_request .salary').text()
  let tags = toArray($('.job_request .position-label .labels')).map(o => $(o).text().trim()).join(',')
  let cFeature = toArray($('.c_feature').children()).map(o => $(o).text().trim())
  let stage = $('.c_feature .icon-glyph-trend').parent().text()
  let employee = $('.c_feature .icon-glyph-figure').parent().text().replace('人规模', '')
  let companyIndex = $('.c_feature .icon-glyph-home').parent().text().replace('公司主页', '')
  let address = $('.work_addr').text().replace('查看地图', '')
  let jobAddress = `https://www.lagou.com/jobs/${id}.html`
  let companyName = $('.job_company .fl').text().replace('拉勾认证企业', '').replace('拉勾未认证企业', '(未认证)')

  let detail = {
    id,
    title: filterStr(title),
    salary: filterStr(salary),
    tags: filterStr(tags),
    stage: filterStr(stage),
    employee: filterStr(employee),
    companyIndex: filterStr(companyIndex),
    companyName: filterStr(companyName),
    address: filterStr(address),
    jobAddress,
  }

  log(detail.companyName)

  return detail
}

let count = 1
let len = 1

const fetchDetail = async(id) => {
  const page = await browser.newPage()
  await page.goto(`https://www.lagou.com/jobs/${id}.html`)

  const content = await page.content()
  await page.close()

  log(`${len}/${count++}`)

  return grapDetail(content, id)
}

module.exports = async({
  concurrency = 1
}) => {
  let queue = new pQueue({
    concurrency
  })

  let ids = await load('ids', [])
  len = ids.length
  let details = await load('details', {})
  let tasks = ids.map(id => {
    return async () => {
      log(`${ids.length}/${++count}`)
      if(details[id]) return details[id]
      
      let detail = await pRetry(async() => {
        return await fetchDetail(id)
      }, {
        retries: 3
      })
      details[id] = detail
      save('details', details)
    }
  })
  await queue.addAll(tasks)
  await queue.onIdle()
}