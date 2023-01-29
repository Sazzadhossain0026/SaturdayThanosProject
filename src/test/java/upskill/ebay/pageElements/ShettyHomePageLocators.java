package upskill.ebay.pageElements;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class ShettyHomePageLocators {

	
	//home button

	
    @FindBy(xpath = "//a[contains(text(),'Home')]")
	
	public WebElement btnHome;
    
    
    
    //courses button
    
    @FindBy(xpath = "//a[contains(text(),'Courses')]")
	
	public WebElement btnCourses;
    
    
    
}