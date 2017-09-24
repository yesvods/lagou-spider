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

  // let res = await getIds({
  //   concurrency: 3
  // })

  // log('getIds done')

  // queue = await jobSpider({
  //   concurrency: 10
  // })
  
  // log('jobSpider done')

  // let details = load('details', [])

  toXls({
    xlsName: 'jobs' 
  })

  let costMinTime = Number((+new Date() - start) / 1000 / 60).toFixed(2)
  log(`cost ${costMinTime}分钟`)
  await browser.close()
})()