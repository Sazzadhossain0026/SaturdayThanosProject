package upskill.ebay.pageAction;

import org.openqa.selenium.support.PageFactory;
import org.testng.Assert;

import upskill.ebay.pageElements.EbaySearchResultLocators;
import upskill.utilities.setupDrivers;

public class EbaySearchResultAction {

	EbaySearchResultLocators EbaySearchResultLocatorsobj;
	
	public EbaySearchResultAction(){
		
		EbaySearchResultLocatorsobj = new EbaySearchResultLocators();
		PageFactory.initElements(setupDrivers.driver, EbaySearchResultLocatorsobj);
	}
	
	public void verifyShoeItem(){
		//opn1
		Assert.assertEquals("Shoes", EbaySearchResultLocatorsobj.ShoeItem.getText());
		
		//opn 2
		Assert.assertTrue(EbaySearchResultLocatorsobj.ShoeItem.isDisplayed());
		
		//opn3
		EbaySearchResultLocatorsobj.ShoeItem.isDisplayed();
	}
	
	
	public void selectShirt() throws Exception{
		Thread.sleep(2000);
		EbaySearchResultLocatorsobj.linkShirtItems.click();
		Thread.sleep(2000);
		
		
		
	}
	
}
