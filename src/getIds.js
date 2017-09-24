const fs = require('fs-extra')
const puppeteer = require('puppeteer');
const cheerio = require('cheerio')
const pQueue = require('p-queue')
const pRetry = require('p-retry')
const {
  contains
} = require('sanife')

const log = console.log.bind(console)
const {
  save,
  load
} = require('./io')

const {
  type,
  city,
  stages,
  domains
} = require('./config')

const grapInfo = content => {
  let $ = cheerio.load(content)
  let ids = Array.from($('#s_position_list .item_con_list').children())
    .map(item => $(item).data('positionid'))

  let pagers = Array.from($('.pager_container').children())
  let totalPage = $(pagers[pagers.length - 2]).attr('page') || 1
  let currentPage = +$('.pager_is_current').text() || 1

  return {
    ids,
    totalPage,
    currentPage
  }
}

const navToNextPage = async (page, info) => {
  await page.click('.pager_is_current + .pager_not_current')
  await page.waitForNavigation({
    waitUntil: 'networkidle',
    networkIdleTimeout: 200,
  })
  let nextContent = await page.content()
  let nextInfo = grapInfo(nextContent)

  if (info.currentPage >= nextInfo.currentPage) {
    return navToNextPage(page, nextInfo)
  }

  return
}

const getIdsByUrl = async url => {
  const page = await browser.newPage();
  await page.goto(url)

  let companyIds = []

  for (let current = 1, totalPage = 1; current <= totalPage; current++) {
    let content = await page.content()
    let info = grapInfo(content)
    companyIds = companyIds.concat(info.ids)

    current = info.currentPage
    totalPage = info.totalPage

    log(`总页数/当前页: ${info.totalPage}/${info.currentPage}, 已爬取公司id数: ${companyIds.length}`)

    if (current < totalPage) {
      // 单页面导航到下一页
      await page.click('.pager_is_current + .pager_not_current')
      await page.waitForNavigation({
        waitUntil: 'networkidle',
        networkIdleTimeout: 500
      })
    }
  }
  await page.close()
  return companyIds
}

module.exports = async ({
  concurrency = 1
}) => {
  let queue = new pQueue({
    concurrency
  })
  let queryCache = await load('queryCache', [])
  let ids = await load('ids', [])

  for (let domain of domains) {
    for (let stage of stages) {
      let queryKey = `${domain}&${stage}`
      if (contains(queryCache, queryKey)) continue
      let url = `https://www.lagou.com/jobs/list_${type}?px=new&gx=全职&city=${city}&isShowMoreIndustryField=true&hy=${domain}&jd=${stage}`
      queue.add(async () => {
        log(`爬取公司id.. 职位：${type} 领域：【${city}${domain}${stage}】`)
        let list = await pRetry(async () => getIdsByUrl(url), {
          retries: 3
        })
        ids = ids.concat(list)
        queryCache.push(queryKey)

        save('ids', ids)
        save('queryCache', queryCache)
      })
    }
  }
  await queue.onIdle()
}