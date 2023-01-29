package upskill.ebay.pageElements;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EbayCartLocators {

	
	
	 @FindBy(xpath = "//select[@aria-label='Please select a Size Type']")
		public WebElement ddSizeType;
	 
	 
	 @FindBy(xpath = "//select[@aria-label='Please select a Size (Men's)']")
		public WebElement ddMenSize;
	 
	 
	 
	 @FindBy(xpath = "//select[@aria-label='Please select a Shade']")
		public WebElement ddShade;
	 
	 
	 
	 @FindBy(xpath = "//input[@id='qtyTextBox']")
		public WebElement txtbxQuantity;
	 
	 
	 @FindBy(xpath = "//*[text()='Add to cart']")
		public WebElement btnAddCart;
	 
}
