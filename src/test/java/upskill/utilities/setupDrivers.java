package upskill.utilities;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import io.github.bonigarcia.wdm.WebDriverManager;

public class setupDrivers {

	public static WebDriver driver; //initializing driver
	
	public static void setupDriver(){
		
		WebDriverManager.chromedriver().setup(); //getting the chrome driver from cloud 
		
		ChromeOptions options = new ChromeOptions(); //initializing chromeOptions
		
		options.addArguments("--start-maximized");
		options.addArguments("--disable-notifications");
	//	options.addArguments("--headless");
		
		driver = new ChromeDriver(options); //initializing chromedriver
		//driver.get("https://www.ebay.com/");
	}
	
	public static WebDriver getDriver(){
		
		return driver;                    //return driver to call
	}
	
	public static void tearDownDriver(){
		
		driver.close(); // closing current driver
		
		driver.quit();  //closing all drivers
	}
}
