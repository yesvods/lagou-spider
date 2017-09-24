const fs = require('fs-extra')
const {
  contains
} = require('sanife')
const puppeteer = require('puppeteer');

const getIds = require('./getIds')
const jobSpider = require('./jobSpider')
const toXls = require('./toXls')

const {
  type,
  city,
  stages,
  domains
} = require('./config')
const {
  load,
  save,
  toName,
} = require('./io')

const {
  str,
  toArray,
  log
} = require('./utils');

(async() => {
  global.browser = await puppeteer.launch();

  let start = +new Date()

  log('=====Fetching ids=====')

  let res = await getIds({
    concurrency: 3
  })

  log('=====Fetching details=====')

  queue = await jobSpider({
    concurrency: 10
  })
  
  log('=====generating xls=====')

  let details = load('details', [])

  toXls({
    xlsName: 'jobs' 
  })

  log('=====Done, visit xls folder to view result=====')

  let costMinTime = Number((+new Date() - start) / 1000 / 60).toFixed(2)
  log(`cost ${costMinTime}分钟`)
  await browser.close()
})()