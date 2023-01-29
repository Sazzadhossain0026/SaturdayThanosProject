package upskill.utilities;



import cucumber.api.Scenario;
import cucumber.api.java.Before;

public class BeforeActions {

	@Before
	public void beforeActions(Scenario scen){
		System.out.println("Initializing driver ....");
		
		setupDrivers.setupDriver();
		
		System.out.println("Test Scenario Name : " + scen.getName());
	}
	
}
