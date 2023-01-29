package upskill.ebay.pageAction;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.PageFactory;

import upskill.ebay.pageElements.EbayHomePageLocators;
import upskill.utilities.setupDrivers;

public class EbayHomePageActions {

		EbayHomePageLocators EbayHomePageLocatorsobj;
		public EbayHomePageActions(){
			
			EbayHomePageLocatorsobj = new EbayHomePageLocators();
			PageFactory.initElements(setupDrivers.driver,EbayHomePageLocatorsobj );
		}
		
		public void searchShoes(){
			
			EbayHomePageLocatorsobj.txtbxSearch.sendKeys("Shoes");
			EbayHomePageLocatorsobj.btnSearch.click();
			
		}
	
	public void searchShirts(){
			
			EbayHomePageLocatorsobj.txtbxSearch.sendKeys("Shirts");
			EbayHomePageLocatorsobj.btnSearch.click();
			
		}
		
	
		
	public void searchItems(String items){
			
			EbayHomePageLocatorsobj.txtbxSearch.sendKeys("items");
			EbayHomePageLocatorsobj.btnSearch.click();
			
		}

	public void mouseHoverMyEbay() throws Exception{
		
		Actions actions = new Actions(setupDrivers.driver);
		actions.moveToElement(EbayHomePageLocatorsobj.linkMyEbay);
		actions.perform();
		Thread.sleep(2000);
	}
	
	public void clickSummary() throws Exception{
		
		EbayHomePageLocatorsobj.linkSummary.isEnabled();
		EbayHomePageLocatorsobj.linkSummary.click();
		
		Thread.sleep(2000);
	}
	
	
	public void keyBoardKeys(){
		
		
			EbayHomePageLocatorsobj.btnSearch.sendKeys(Keys.ENTER);
			EbayHomePageLocatorsobj.btnSearch.sendKeys(Keys.UP);
			EbayHomePageLocatorsobj.btnSearch.sendKeys(Keys.DOWN);
			EbayHomePageLocatorsobj.btnSearch.sendKeys(Keys.CLEAR);
			EbayHomePageLocatorsobj.btnSearch.sendKeys(Keys.DELETE);
		}
	
	
	public void handleAlert(){
		setupDrivers.driver.switchTo().alert().accept();
		setupDrivers.driver.switchTo().alert().dismiss();
		setupDrivers.driver.switchTo().alert().sendKeys("Good Feedback");
		setupDrivers.driver.switchTo().alert().getText();
	}
	
	
	public void javaScriptExecutor(){
		JavascriptExecutor js = (JavascriptExecutor)setupDrivers.driver;	//Creating JS object
		
		js.executeScript("");
		
		js.executeScript("EbaySearchResultLocatorsObj.cbxBrandNike.click();"); //Clicking on element
		
		js.executeScript("EbayHomePageLocatorsObj.txtbxSearch.value ='shirt';"); //Writing something
		
		js.executeScript("EbaySearchResultLocatorsObj.cbxBrandNike.checked=true;"); //Interect Checkbox
		
		js.executeScript("window.location = 'http://upskill.com';"); // initializing location
		
		js.executeScript("location.reload()"); 						//Refresh browser
		
		js.executeScript("alert('Confirmation');");					//Alert
		
		js.executeScript("window.scrollBy(0,500)", ""); 			//Scroll down to specific pixel
		
		js.executeScript("window.scrollBy(0,-500)", ""); 			//Scroll up to specific pixel
		
		js.executeScript("arguments[0].scrollIntoView();", EbayHomePageLocatorsobj.btnSearch);  //Scroll to a object
		
		js.executeScript("window.scrollBy(0,document.body.scrollHeight)"); //Scroll down to bottom of website
	}
	
	
	//https://rahulshettyacademy.com/AutomationPractice/
	
	}


	

