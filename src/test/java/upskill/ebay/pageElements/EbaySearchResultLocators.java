package upskill.ebay.pageElements;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class EbaySearchResultLocators {

	//shoe link
	@FindBy(xpath = "//span[2][contains(text(),'shoe')")
	
	public WebElement ShoeItem;
	
	//shirt link
	
    @FindBy(xpath = "//*[text()='Big & Tall Cotton Tee. Sizes 4 XLT to 8XLT. With & without pockets. MADE IN USA']")
	
    public WebElement linkShirtItems;
	
}
