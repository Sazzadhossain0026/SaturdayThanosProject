package upskill.ebay.pageAction;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import upskill.ebay.pageElements.EbayHomePageLocators;
import upskill.ebay.pageElements.ShettyHomePageLocators;
import upskill.utilities.setupDrivers;

public class ShettyHomePageActions {

	
	ShettyHomePageLocators ShettyHomePageLocatorsobj;
	
	public ShettyHomePageActions(){
		
		ShettyHomePageLocatorsobj = new ShettyHomePageLocators();
		PageFactory.initElements(setupDrivers.driver,ShettyHomePageLocatorsobj );
		
	
	}
	
	public void loadShettyHomePage() throws Exception{
		setupDrivers.driver.get("https://rahulshettyacademy.com/AutomationPractice/");
		Thread.sleep(3000);
	}
		
		
		
		//Selenium Wait : 1. Implicit wait(Global), 2. Explicit wait(Conditional), 3. Fluent wait(intermittent)

		//SetupDrivers.driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);				//Implicit Wait
		
		//WebDriverWait wait = new WebDriverWait(SetupDrivers.driver, 20);
		//wait.until(ExpectedConditions.elementToBeClickable(EbayHomepageLocatorsObj.txtbxSearch));	//Explicit wait
		
		//FluentWait fluentWait = new FluentWait(SetupDrivers.driver);								//Fluent Wait
						//fluentWait.withTimeout(20, TimeUnit.SECONDS);
						//fluentWait.pollingEvery(5, TimeUnit.SECONDS);
						//fluentWait.ignoring(NoSuchElementException.class);
					//fluentWait.withMessage("Fluent Wait Time exceeded");
		
		
		
		
	
	
	public void clickIframeHome(){
    List<WebElement> framelist = setupDrivers.driver.findElements(By.id("courses-iframe"));
		
		for (int i = 0; i<framelist.size(); i++){
			setupDrivers.driver.switchTo().frame(i);
			
			try{
				 ShettyHomePageLocatorsobj.btnHome.click();
			} catch (Exception e){
				System.out.println("Element not found in iframe");
			}
		}
			
	}
	
	
	public void clickIframeCourses(){
	    List<WebElement> framelist = setupDrivers.driver.findElements(By.id("courses-iframe"));
			
			for (int i = 0; i<framelist.size(); i++){
				setupDrivers.driver.switchTo().frame(i);
				
				try{
					 ShettyHomePageLocatorsobj.btnCourses.click();
				} catch (Exception e){
					System.out.println("Element not found in iframe");
				}
			}
				
		}
	
	public void verifyShettyHome() throws Exception{
		
		Thread.sleep(5000);
		ShettyHomePageLocatorsobj.btnHome.isDisplayed();
	}
	
      public void verifyShettyCourses() throws Exception{
		
		Thread.sleep(5000);
		ShettyHomePageLocatorsobj.btnCourses.isDisplayed();
	}
	
	
	
	
	
public void handleIframe(){
		
		//i find iframe using iframe tag in DOM or HTML
		//i use switchTo().frame() to switch iframes
		
		//Switch iframe by Index
		setupDrivers.driver.switchTo().frame(0);
		setupDrivers.driver.switchTo().frame(1);
		
		//Switch iframe by Name or ID
		setupDrivers.driver.switchTo().frame("iframe-name");
		setupDrivers.driver.switchTo().frame("id");
		
		//Switch back to previous iframe
		setupDrivers.driver.switchTo().defaultContent();
		setupDrivers.driver.switchTo().parentFrame();
		setupDrivers.driver.switchTo().frame("parent");
		
		//nested iframe
		setupDrivers.driver.switchTo().frame("inner");
		setupDrivers.driver.switchTo().frame("child");
	}
}
