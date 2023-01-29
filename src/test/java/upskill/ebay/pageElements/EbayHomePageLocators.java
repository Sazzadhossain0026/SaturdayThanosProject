package upskill.ebay.pageElements;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EbayHomePageLocators {

	
	
	
	//Search text box
	
	@FindBy(xpath="//input[@placeholder='Search for anything']")
	
	public WebElement txtbxSearch;
	
	//search button
	
	@FindBy(xpath="//input[@value='Search']")
	public WebElement btnSearch;
	
	
	//My Ebay Link
		@FindBy(xpath="//a[@title ='My eBay']")
		public WebElement linkMyEbay;
		
		
		//Summary
		@FindBy(xpath="//a[contains(text(),'Summary')]")
		public WebElement linkSummary;
	
	
	
}
