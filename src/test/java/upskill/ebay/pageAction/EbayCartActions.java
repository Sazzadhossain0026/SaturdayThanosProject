package upskill.ebay.pageAction;

import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.Select;

import upskill.ebay.pageElements.EbayCartLocators;
import upskill.utilities.setupDrivers;

public class EbayCartActions {

	EbayCartLocators EbayCartLocatorsobj = new EbayCartLocators();
	
	
	public EbayCartActions(){
		
		PageFactory.initElements(setupDrivers.driver,EbayCartLocatorsobj );
	}
	
	
		
	public void switchNewWindow(){
			
		for (String winhandle : setupDrivers.driver.getWindowHandles()) {
			setupDrivers.driver.switchTo(). window(winhandle);}
	
	}
		
	public void selectSizeTypeDD() throws Exception{
			
		Thread.sleep(2000);
		Select dropDownobj = new Select(EbayCartLocatorsobj.ddSizeType);
		dropDownobj.selectByVisibleText("Big & Tall");
		Thread.sleep(2000);
			
	}
		
	public void selectMenSizeDD() throws Exception{
		Thread.sleep(2000);
		Select dropDownobj = new Select(EbayCartLocatorsobj.ddMenSize);
		//dropDownObj.selectByVisibleText("8XL");
		//dropDownObj.selectByIndex("5");
		dropDownobj.selectByValue("5");
		Thread.sleep(2000);
	}
	
	public void selectShadeDD() throws Exception{
		
		
		Thread.sleep(2000);
		
		Select dropDownobj = new Select(EbayCartLocatorsobj.ddShade);
		
		dropDownobj.selectByVisibleText("Black");
		

		Thread.sleep(2000);
		
		
		
		
	}
	
	
	public void enterQuantity() throws Exception{
		Thread.sleep(2000);
		EbayCartLocatorsobj.txtbxQuantity.clear ();
		EbayCartLocatorsobj.txtbxQuantity.sendKeys ("2");
		
	}
	
	public void addToCart() throws Exception{
		
		Thread.sleep(2000);
		EbayCartLocatorsobj.btnAddCart.click ();
		Thread.sleep(2000);
	}


}
