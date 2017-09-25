

(async () => {
  const puppeteer = require('puppeteer')
  const {contains} = require('sanife')
  const _ = require('lodash')
  let browser = await puppeteer.launch();
  const page = await browser.newPage()
  let url = "https://www.lagou.com/jobs/3502895.html"

  await page.goto(url)
  // let res = await page.$('.job-name')
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

  Object.keys(pageInfo).forEach(key => {
    if(typeof pageInfo[key] == 'string')
      pageInfo[key] = pageInfo[key].trim()
  })
  console.log(pageInfo)

  await page.close()
  await browser.close()
})()