package upskill.utilities;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;



import cucumber.api.Scenario;
import cucumber.api.java.After;




	public class AfterActions {

		TakeScreenshot TakeScreenshotObj = new TakeScreenshot();
		@After
		public void afterActions(Scenario Scenario) throws Exception{
			
			
			if(Scenario.isFailed()){
				TakeScreenshotObj.screenshots();
				Scenario.embed(((TakesScreenshot) setupDrivers.driver).getScreenshotAs(OutputType.BYTES),"image/png");
			}
			
			setupDrivers.tearDownDriver();
			
			System.out.println("-----test complete, browser closed");
		}
	}


