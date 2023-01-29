$(document).ready(function() {var formatter = new CucumberHTML.DOMFormatter($('.cucumber-report'));formatter.uri("EbayBrandOutline.feature");
formatter.feature({
  "line": 2,
  "name": "Ebay Brand Outline",
  "description": "\r\nDescription: User should able to filter items by Brand",
  "id": "ebay-brand-outline",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@us-246"
    }
  ]
});
formatter.scenarioOutline({
  "line": 9,
  "name": "Filter items by Brand",
  "description": "",
  "id": "ebay-brand-outline;filter-items-by-brand",
  "type": "scenario_outline",
  "keyword": "Scenario Outline"
});
formatter.step({
  "line": 10,
  "name": "Search for \"\u003cItems\u003e\"",
  "keyword": "Given "
});
formatter.step({
  "line": 11,
  "name": "Filter by \"\u003cBrand\u003e\"",
  "keyword": "When "
});
formatter.step({
  "line": 12,
  "name": "Item list should have products of \"\u003cBrand\u003e\"",
  "keyword": "Then "
});
formatter.examples({
  "line": 14,
  "name": "",
  "description": "",
  "id": "ebay-brand-outline;filter-items-by-brand;",
  "rows": [
    {
      "cells": [
        "Items",
        "Brand"
      ],
      "line": 15,
      "id": "ebay-brand-outline;filter-items-by-brand;;1"
    },
    {
      "cells": [
        "Shoes",
        "Nike"
      ],
      "line": 16,
      "id": "ebay-brand-outline;filter-items-by-brand;;2"
    },
    {
      "cells": [
        "Shirts",
        "Adidas"
      ],
      "line": 17,
      "id": "ebay-brand-outline;filter-items-by-brand;;3"
    },
    {
      "cells": [
        "Pants",
        "Unbranded"
      ],
      "line": 18,
      "id": "ebay-brand-outline;filter-items-by-brand;;4"
    }
  ],
  "keyword": "Examples"
});
formatter.before({
  "duration": 3327296899,
  "status": "passed"
});
formatter.background({
  "line": 6,
  "name": "",
  "description": "",
  "type": "background",
  "keyword": "Background"
});
formatter.step({
  "line": 7,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 208630800,
  "status": "passed"
});
formatter.scenario({
  "line": 16,
  "name": "Filter items by Brand",
  "description": "",
  "id": "ebay-brand-outline;filter-items-by-brand;;2",
  "type": "scenario",
  "keyword": "Scenario Outline",
  "tags": [
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@us-246"
    }
  ]
});
formatter.step({
  "line": 10,
  "name": "Search for \"Shoes\"",
  "matchedColumns": [
    0
  ],
  "keyword": "Given "
});
formatter.step({
  "line": 11,
  "name": "Filter by \"Nike\"",
  "matchedColumns": [
    1
  ],
  "keyword": "When "
});
formatter.step({
  "line": 12,
  "name": "Item list should have products of \"Nike\"",
  "matchedColumns": [
    1
  ],
  "keyword": "Then "
});
formatter.match({
  "arguments": [
    {
      "val": "Shoes",
      "offset": 12
    }
  ],
  "location": "EbayHomePageSteps.search_for(String)"
});
formatter.result({
  "duration": 3214352500,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Nike",
      "offset": 11
    }
  ],
  "location": "EbaySearchResultsStep.filter_by(String)"
});
formatter.result({
  "duration": 5595400,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Nike",
      "offset": 35
    }
  ],
  "location": "EbaySearchResultsStep.item_list_should_have_products_of(String)"
});
formatter.result({
  "duration": 58500,
  "status": "passed"
});
formatter.after({
  "duration": 998350500,
  "status": "passed"
});
formatter.before({
  "duration": 2329911101,
  "status": "passed"
});
formatter.background({
  "line": 6,
  "name": "",
  "description": "",
  "type": "background",
  "keyword": "Background"
});
formatter.step({
  "line": 7,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 400300,
  "status": "passed"
});
formatter.scenario({
  "line": 17,
  "name": "Filter items by Brand",
  "description": "",
  "id": "ebay-brand-outline;filter-items-by-brand;;3",
  "type": "scenario",
  "keyword": "Scenario Outline",
  "tags": [
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@us-246"
    }
  ]
});
formatter.step({
  "line": 10,
  "name": "Search for \"Shirts\"",
  "matchedColumns": [
    0
  ],
  "keyword": "Given "
});
formatter.step({
  "line": 11,
  "name": "Filter by \"Adidas\"",
  "matchedColumns": [
    1
  ],
  "keyword": "When "
});
formatter.step({
  "line": 12,
  "name": "Item list should have products of \"Adidas\"",
  "matchedColumns": [
    1
  ],
  "keyword": "Then "
});
formatter.match({
  "arguments": [
    {
      "val": "Shirts",
      "offset": 12
    }
  ],
  "location": "EbayHomePageSteps.search_for(String)"
});
formatter.result({
  "duration": 2836100699,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Adidas",
      "offset": 11
    }
  ],
  "location": "EbaySearchResultsStep.filter_by(String)"
});
formatter.result({
  "duration": 329000,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Adidas",
      "offset": 35
    }
  ],
  "location": "EbaySearchResultsStep.item_list_should_have_products_of(String)"
});
formatter.result({
  "duration": 85200,
  "status": "passed"
});
formatter.after({
  "duration": 946788301,
  "status": "passed"
});
formatter.before({
  "duration": 2214764700,
  "status": "passed"
});
formatter.background({
  "line": 6,
  "name": "",
  "description": "",
  "type": "background",
  "keyword": "Background"
});
formatter.step({
  "line": 7,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 2076799,
  "status": "passed"
});
formatter.scenario({
  "line": 18,
  "name": "Filter items by Brand",
  "description": "",
  "id": "ebay-brand-outline;filter-items-by-brand;;4",
  "type": "scenario",
  "keyword": "Scenario Outline",
  "tags": [
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@us-246"
    }
  ]
});
formatter.step({
  "line": 10,
  "name": "Search for \"Pants\"",
  "matchedColumns": [
    0
  ],
  "keyword": "Given "
});
formatter.step({
  "line": 11,
  "name": "Filter by \"Unbranded\"",
  "matchedColumns": [
    1
  ],
  "keyword": "When "
});
formatter.step({
  "line": 12,
  "name": "Item list should have products of \"Unbranded\"",
  "matchedColumns": [
    1
  ],
  "keyword": "Then "
});
formatter.match({
  "arguments": [
    {
      "val": "Pants",
      "offset": 12
    }
  ],
  "location": "EbayHomePageSteps.search_for(String)"
});
formatter.result({
  "duration": 2600437900,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Unbranded",
      "offset": 11
    }
  ],
  "location": "EbaySearchResultsStep.filter_by(String)"
});
formatter.result({
  "duration": 636600,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Unbranded",
      "offset": 35
    }
  ],
  "location": "EbaySearchResultsStep.item_list_should_have_products_of(String)"
});
formatter.result({
  "duration": 102799,
  "status": "passed"
});
formatter.after({
  "duration": 1153825900,
  "status": "passed"
});
formatter.uri("EbayCartDRopDown.feature");
formatter.feature({
  "line": 2,
  "name": "Ebay Cart Functionality",
  "description": "\r\nDescription: User should able to add items in cart",
  "id": "ebay-cart-functionality",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@us-248"
    }
  ]
});
formatter.before({
  "duration": 2302853800,
  "status": "passed"
});
formatter.background({
  "line": 6,
  "name": "",
  "description": "",
  "type": "background",
  "keyword": "Background"
});
formatter.step({
  "line": 7,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 946600,
  "status": "passed"
});
formatter.scenario({
  "line": 9,
  "name": "Ebay cart functionality",
  "description": "",
  "id": "ebay-cart-functionality;ebay-cart-functionality",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 10,
  "name": "Search for Big Tall Cotton Tee",
  "keyword": "Given "
});
formatter.step({
  "line": 11,
  "name": "Select the first shirt on item list",
  "keyword": "When "
});
formatter.step({
  "line": 12,
  "name": "Select Size",
  "keyword": "And "
});
formatter.step({
  "line": 13,
  "name": "Select Men Size",
  "keyword": "And "
});
formatter.step({
  "line": 14,
  "name": "Select Shade",
  "keyword": "And "
});
formatter.step({
  "line": 15,
  "name": "Select Quantity",
  "keyword": "And "
});
formatter.step({
  "line": 16,
  "name": "Add to shopping cart",
  "keyword": "Then "
});
formatter.match({
  "location": "EbayHomePageSteps.search_for_Big_Tall_Cotton_Tee()"
});
formatter.result({
  "duration": 3293479700,
  "status": "passed"
});
formatter.match({
  "location": "EbaySearchResultsStep.select_the_first_shirt_on_item_list()"
});
formatter.result({
  "duration": 2041665101,
  "error_message": "org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {\"method\":\"xpath\",\"selector\":\"//*[text()\u003d\u0027Big \u0026 Tall Cotton Tee. Sizes 4 XLT to 8XLT. With \u0026 without pockets. MADE IN USA\u0027]\"}\n  (Session info: chrome\u003d108.0.5359.125)\nFor documentation on this error, please visit: http://seleniumhq.org/exceptions/no_such_element.html\nBuild info: version: \u00273.12.0\u0027, revision: \u00277c6e0b3\u0027, time: \u00272018-05-08T14:04:26.12Z\u0027\nSystem info: host: \u0027LAPTOP-2Q9UMQ9M\u0027, ip: \u0027192.168.1.162\u0027, os.name: \u0027Windows 10\u0027, os.arch: \u0027amd64\u0027, os.version: \u002710.0\u0027, java.version: \u00271.8.0_202\u0027\nDriver info: org.openqa.selenium.chrome.ChromeDriver\nCapabilities {acceptInsecureCerts: false, browserName: chrome, browserVersion: 108.0.5359.125, chrome: {chromedriverVersion: 108.0.5359.71 (1e0e3868ee06..., userDataDir: C:\\Users\\DEFAUL~1.LAP\\AppDa...}, goog:chromeOptions: {debuggerAddress: localhost:65292}, javascriptEnabled: true, networkConnectionEnabled: false, pageLoadStrategy: normal, platform: WINDOWS, platformName: WINDOWS, proxy: Proxy(), setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:virtualAuthenticators: true}\nSession ID: d8b5893bdd1e72dd0c8edfafe8b6505e\n*** Element info: {Using\u003dxpath, value\u003d//*[text()\u003d\u0027Big \u0026 Tall Cotton Tee. Sizes 4 XLT to 8XLT. With \u0026 without pockets. MADE IN USA\u0027]}\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)\r\n\tat sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)\r\n\tat java.lang.reflect.Constructor.newInstance(Constructor.java:423)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.createException(W3CHttpResponseCodec.java:187)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:122)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:49)\r\n\tat org.openqa.selenium.remote.HttpCommandExecutor.execute(HttpCommandExecutor.java:158)\r\n\tat org.openqa.selenium.remote.service.DriverCommandExecutor.execute(DriverCommandExecutor.java:83)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.execute(RemoteWebDriver.java:543)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:317)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElementByXPath(RemoteWebDriver.java:419)\r\n\tat org.openqa.selenium.By$ByXPath.findElement(By.java:353)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:309)\r\n\tat org.openqa.selenium.support.pagefactory.DefaultElementLocator.findElement(DefaultElementLocator.java:69)\r\n\tat org.openqa.selenium.support.pagefactory.internal.LocatingElementHandler.invoke(LocatingElementHandler.java:38)\r\n\tat com.sun.proxy.$Proxy18.click(Unknown Source)\r\n\tat upskill.ebay.pageAction.EbaySearchResultAction.selectShirt(EbaySearchResultAction.java:33)\r\n\tat upskill.ebay.stepDef.EbaySearchResultsStep.select_the_first_shirt_on_item_list(EbaySearchResultsStep.java:42)\r\n\tat ✽.When Select the first shirt on item list(EbayCartDRopDown.feature:11)\r\n",
  "status": "failed"
});
formatter.match({
  "location": "EbayCartSteps.select_Size()"
});
formatter.result({
  "status": "skipped"
});
formatter.match({
  "location": "EbayCartSteps.select_Men_Size()"
});
formatter.result({
  "status": "skipped"
});
formatter.match({
  "location": "EbayCartSteps.select_Shade()"
});
formatter.result({
  "status": "skipped"
});
formatter.match({
  "location": "EbayCartSteps.select_Quantity()"
});
formatter.result({
  "status": "skipped"
});
formatter.match({
  "location": "EbayCartSteps.add_to_shopping_cart()"
});
formatter.result({
  "status": "skipped"
});
formatter.after({
  "duration": 1039014000,
  "status": "passed"
});
formatter.uri("EbaySearchShoes.feature");
formatter.feature({
  "line": 2,
  "name": "Ebay Search Functionality",
  "description": "",
  "id": "ebay-search-functionality",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@SKYW-15"
    },
    {
      "line": 1,
      "name": "@E2E"
    }
  ]
});
formatter.before({
  "duration": 2275971499,
  "status": "passed"
});
formatter.scenario({
  "line": 4,
  "name": "Search for Shoes",
  "description": "",
  "id": "ebay-search-functionality;search-for-shoes",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 5,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.step({
  "line": 6,
  "name": "Search for shoes",
  "keyword": "When "
});
formatter.step({
  "line": 7,
  "name": "Item list should have only shoes related products",
  "keyword": "Then "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 377999,
  "status": "passed"
});
formatter.match({
  "location": "EbayHomePageSteps.search_for_shoes()"
});
formatter.result({
  "duration": 4085556800,
  "status": "passed"
});
formatter.match({
  "location": "EbaySearchResultsStep.item_list_should_have_only_shoes_related_products()"
});
formatter.result({
  "duration": 2045536300,
  "error_message": "org.openqa.selenium.InvalidSelectorException: invalid selector: Unable to locate an element with the xpath expression //span[2][contains(text(),\u0027shoe\u0027) because of the following error:\nSyntaxError: Failed to execute \u0027evaluate\u0027 on \u0027Document\u0027: The string \u0027//span[2][contains(text(),\u0027shoe\u0027)\u0027 is not a valid XPath expression.\n  (Session info: chrome\u003d108.0.5359.125)\nFor documentation on this error, please visit: http://seleniumhq.org/exceptions/invalid_selector_exception.html\nBuild info: version: \u00273.12.0\u0027, revision: \u00277c6e0b3\u0027, time: \u00272018-05-08T14:04:26.12Z\u0027\nSystem info: host: \u0027LAPTOP-2Q9UMQ9M\u0027, ip: \u0027192.168.1.162\u0027, os.name: \u0027Windows 10\u0027, os.arch: \u0027amd64\u0027, os.version: \u002710.0\u0027, java.version: \u00271.8.0_202\u0027\nDriver info: org.openqa.selenium.chrome.ChromeDriver\nCapabilities {acceptInsecureCerts: false, browserName: chrome, browserVersion: 108.0.5359.125, chrome: {chromedriverVersion: 108.0.5359.71 (1e0e3868ee06..., userDataDir: C:\\Users\\DEFAUL~1.LAP\\AppDa...}, goog:chromeOptions: {debuggerAddress: localhost:65376}, javascriptEnabled: true, networkConnectionEnabled: false, pageLoadStrategy: normal, platform: WINDOWS, platformName: WINDOWS, proxy: Proxy(), setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:virtualAuthenticators: true}\nSession ID: e6ea2ce339818ab6872bcb05043a90dc\n*** Element info: {Using\u003dxpath, value\u003d//span[2][contains(text(),\u0027shoe\u0027)}\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)\r\n\tat sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)\r\n\tat java.lang.reflect.Constructor.newInstance(Constructor.java:423)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.createException(W3CHttpResponseCodec.java:187)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:122)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:49)\r\n\tat org.openqa.selenium.remote.HttpCommandExecutor.execute(HttpCommandExecutor.java:158)\r\n\tat org.openqa.selenium.remote.service.DriverCommandExecutor.execute(DriverCommandExecutor.java:83)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.execute(RemoteWebDriver.java:543)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:317)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElementByXPath(RemoteWebDriver.java:419)\r\n\tat org.openqa.selenium.By$ByXPath.findElement(By.java:353)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:309)\r\n\tat org.openqa.selenium.support.pagefactory.DefaultElementLocator.findElement(DefaultElementLocator.java:69)\r\n\tat org.openqa.selenium.support.pagefactory.internal.LocatingElementHandler.invoke(LocatingElementHandler.java:38)\r\n\tat com.sun.proxy.$Proxy18.getText(Unknown Source)\r\n\tat upskill.ebay.pageAction.EbaySearchResultAction.verifyShoeItem(EbaySearchResultAction.java:21)\r\n\tat upskill.ebay.stepDef.EbaySearchResultsStep.item_list_should_have_only_shoes_related_products(EbaySearchResultsStep.java:18)\r\n\tat ✽.Then Item list should have only shoes related products(EbaySearchShoes.feature:7)\r\n",
  "status": "failed"
});
formatter.after({
  "duration": 995975599,
  "status": "passed"
});
formatter.uri("EbaySummaryMouseHover.feature");
formatter.feature({
  "line": 2,
  "name": "Ebay Summary Mousehover",
  "description": "",
  "id": "ebay-summary-mousehover",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@regression"
    }
  ]
});
formatter.before({
  "duration": 2442944900,
  "status": "passed"
});
formatter.scenario({
  "line": 4,
  "name": "Ebay Summary Mousehover",
  "description": "",
  "id": "ebay-summary-mousehover;ebay-summary-mousehover",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 5,
  "name": "Open Ebay Homepage",
  "keyword": "Given "
});
formatter.step({
  "line": 6,
  "name": "Mouse Hover to MyEbay Summary",
  "keyword": "When "
});
formatter.step({
  "line": 7,
  "name": "Click on Summary",
  "keyword": "Then "
});
formatter.match({
  "location": "EbayHomePageSteps.open_Ebay_Homepage()"
});
formatter.result({
  "duration": 356200,
  "status": "passed"
});
formatter.match({
  "location": "EbayHomePageSteps.mouse_Hover_to_MyEbay_Summary()"
});
formatter.result({
  "duration": 2598634201,
  "status": "passed"
});
formatter.match({
  "location": "EbayHomePageSteps.click_on_Summary()"
});
formatter.result({
  "duration": 4198936300,
  "status": "passed"
});
formatter.after({
  "duration": 973371999,
  "status": "passed"
});
formatter.uri("ShettyiFrame.feature");
formatter.feature({
  "line": 2,
  "name": "Rahul Shetty iframe practice",
  "description": "",
  "id": "rahul-shetty-iframe-practice",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@regression"
    },
    {
      "line": 1,
      "name": "@smoke"
    },
    {
      "line": 1,
      "name": "@SKYW-20"
    },
    {
      "line": 1,
      "name": "@E2E"
    }
  ]
});
formatter.before({
  "duration": 2181177700,
  "status": "passed"
});
formatter.scenario({
  "line": 4,
  "name": "Iframe Practice",
  "description": "",
  "id": "rahul-shetty-iframe-practice;iframe-practice",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 5,
  "name": "Open Shetty Homepage",
  "keyword": "Given "
});
formatter.step({
  "line": 6,
  "name": "Click on iFrame Home",
  "keyword": "When "
});
formatter.step({
  "line": 7,
  "name": "It should reload iframe homepage",
  "keyword": "Then "
});
formatter.match({
  "location": "ShettyHomePageSteps.open_Shetty_Homepage()"
});
formatter.result({
  "duration": 7964086800,
  "status": "passed"
});
formatter.match({
  "location": "ShettyHomePageSteps.click_on_iFrame_Home()"
});
formatter.result({
  "duration": 137013201,
  "status": "passed"
});
formatter.match({
  "location": "ShettyHomePageSteps.it_should_reload_iframe_homepage()"
});
formatter.result({
  "duration": 5043195801,
  "status": "passed"
});
formatter.after({
  "duration": 995515400,
  "status": "passed"
});
formatter.before({
  "duration": 2453003800,
  "status": "passed"
});
formatter.scenario({
  "line": 11,
  "name": "Iframe Practice",
  "description": "",
  "id": "rahul-shetty-iframe-practice;iframe-practice",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 12,
  "name": "Open Shetty Homepage",
  "keyword": "Given "
});
formatter.step({
  "line": 13,
  "name": "Click on iFrame courses",
  "keyword": "When "
});
formatter.step({
  "line": 14,
  "name": "It should reload iframe coursespage",
  "keyword": "Then "
});
formatter.match({
  "location": "ShettyHomePageSteps.open_Shetty_Homepage()"
});
formatter.result({
  "duration": 7939006101,
  "status": "passed"
});
formatter.match({
  "location": "ShettyHomePageSteps.click_on_iFrame_courses()"
});
formatter.result({
  "duration": 139686101,
  "status": "passed"
});
formatter.match({
  "location": "ShettyHomePageSteps.it_should_reload_iframe_coursespage()"
});
formatter.result({
  "duration": 5028176199,
  "error_message": "org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {\"method\":\"xpath\",\"selector\":\"//a[contains(text(),\u0027Courses\u0027)]\"}\n  (Session info: chrome\u003d108.0.5359.125)\nFor documentation on this error, please visit: http://seleniumhq.org/exceptions/no_such_element.html\nBuild info: version: \u00273.12.0\u0027, revision: \u00277c6e0b3\u0027, time: \u00272018-05-08T14:04:26.12Z\u0027\nSystem info: host: \u0027LAPTOP-2Q9UMQ9M\u0027, ip: \u0027192.168.1.162\u0027, os.name: \u0027Windows 10\u0027, os.arch: \u0027amd64\u0027, os.version: \u002710.0\u0027, java.version: \u00271.8.0_202\u0027\nDriver info: org.openqa.selenium.chrome.ChromeDriver\nCapabilities {acceptInsecureCerts: false, browserName: chrome, browserVersion: 108.0.5359.125, chrome: {chromedriverVersion: 108.0.5359.71 (1e0e3868ee06..., userDataDir: C:\\Users\\DEFAUL~1.LAP\\AppDa...}, goog:chromeOptions: {debuggerAddress: localhost:49289}, javascriptEnabled: true, networkConnectionEnabled: false, pageLoadStrategy: normal, platform: WINDOWS, platformName: WINDOWS, proxy: Proxy(), setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:virtualAuthenticators: true}\nSession ID: 5496f08f541f6ae9c20a8d2d5ebde746\n*** Element info: {Using\u003dxpath, value\u003d//a[contains(text(),\u0027Courses\u0027)]}\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)\r\n\tat sun.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)\r\n\tat sun.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)\r\n\tat java.lang.reflect.Constructor.newInstance(Constructor.java:423)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.createException(W3CHttpResponseCodec.java:187)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:122)\r\n\tat org.openqa.selenium.remote.http.W3CHttpResponseCodec.decode(W3CHttpResponseCodec.java:49)\r\n\tat org.openqa.selenium.remote.HttpCommandExecutor.execute(HttpCommandExecutor.java:158)\r\n\tat org.openqa.selenium.remote.service.DriverCommandExecutor.execute(DriverCommandExecutor.java:83)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.execute(RemoteWebDriver.java:543)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:317)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElementByXPath(RemoteWebDriver.java:419)\r\n\tat org.openqa.selenium.By$ByXPath.findElement(By.java:353)\r\n\tat org.openqa.selenium.remote.RemoteWebDriver.findElement(RemoteWebDriver.java:309)\r\n\tat org.openqa.selenium.support.pagefactory.DefaultElementLocator.findElement(DefaultElementLocator.java:69)\r\n\tat org.openqa.selenium.support.pagefactory.internal.LocatingElementHandler.invoke(LocatingElementHandler.java:38)\r\n\tat com.sun.proxy.$Proxy18.isDisplayed(Unknown Source)\r\n\tat upskill.ebay.pageAction.ShettyHomePageActions.verifyShettyCourses(ShettyHomePageActions.java:73)\r\n\tat upskill.ebay.stepDef.ShettyHomePageSteps.it_should_reload_iframe_coursespage(ShettyHomePageSteps.java:29)\r\n\tat ✽.Then It should reload iframe coursespage(ShettyiFrame.feature:14)\r\n",
  "status": "failed"
});
formatter.after({
  "duration": 1031373901,
  "status": "passed"
});
});