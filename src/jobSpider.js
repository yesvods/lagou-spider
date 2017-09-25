const fs = require('fs-extra')
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const _ = require('lodash')
const pQueue = require('p-queue')
const pRetry = require('p-retry')
const delay = require('delay')
const {contains} = require('sanife')

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

const grapDetail = async (page, id) => {

  let url = `https://www.lagou.com/jobs/${id}.html`
  await page.goto(url)

  let pageInfo = await page.evaluate(() => {
    let title = document.querySelector('.job-name').innerText
    let salary = document.querySelector('.job_request .salary').innerText
    let tags = Array.from(document.querySelectorAll('.job_request .position-label .labels')).map(o => o.innerText.trim()).join(',')
    let stage = document.querySelector('.c_feature .icon-glyph-trend').parentNode.innerText
    let employee = document.querySelector('.c_feature .icon-glyph-figure').parentNode.innerText.replace('人规模', '')
    let companyIndex = document.querySelector('.c_feature .icon-glyph-home').parentNode.innerText.replace('公司主页', '')
    let address = document.querySelector('.work_addr').innerText.replace('查看地图', '')
    let companyName = document.querySelector('.job_company .fl').innerText.replace('拉勾认证企业', '').replace('拉勾未认证企业', '(未认证)')
    let formHead = document.querySelector('.form_head') && document.querySelector('.form_head').innerText || '' 
    return {
      title,
      salary,
      tags,
      stage,
      employee,
      companyIndex,
      address,
      companyName,
      isValidatePage: formHead.indexOf('密码登录') < 0
    }
  })

  if(!pageInfo.isValidatePage){
    return grapDetail(page, id)
  }

  Object.keys(pageInfo).forEach(key => {
    if(typeof pageInfo[key] == 'string')
      pageInfo[key] = pageInfo[key].trim()
  })

  return pageInfo
}

let count = 1
let len = 1

// const fetchPageContent = async (id, page) => {
//   let url = `https://www.lagou.com/jobs/${id}.html`
//   await page.goto(url)
//   const content = await page.content()
//   if(!content || contains(content, '密码登录')){
//     await delay(500)
//     log(`retry ${url}`)
//     return await fetchPageContent(id, page)
//   }
//   return content
// }

const fetchDetail = async(id) => {
  const page = await browser.newPage()

  const detail = await grapDetail(page, id)

  await page.close()

  if(!detail.companyName){
    log(`https://www.lagou.com/jobs/${id}.html` ,content)
  }

  log(`${len}/${count++}, ${detail.companyName}`)
  
  return detail
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