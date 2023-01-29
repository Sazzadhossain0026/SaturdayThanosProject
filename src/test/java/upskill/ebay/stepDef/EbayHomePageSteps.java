package upskill.ebay.stepDef;

import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import upskill.ebay.pageAction.EbayHomePageActions;

public class EbayHomePageSteps {

	
	EbayHomePageActions EbayHomePageActionsobj = new EbayHomePageActions();
	
	@Given("^Open Ebay Homepage$")
	public void open_Ebay_Homepage() throws Throwable {
		
		
		
	}
	
	@When("^Search for shoes$")
	public void search_for_shoes() throws Throwable {
	  
		EbayHomePageActionsobj.searchShoes();
	}
	
	@Given("^Search for Shirts$")
	public void search_for_shirts() throws Throwable {
	    
	}
	
	
	
	@Given("^Search for \"([^\"]*)\"$")
	public void search_for(String items) throws Throwable {
	 
		EbayHomePageActionsobj.searchItems(items);
	}
	
	@Given("^Search for Big Tall Cotton Tee$")
	public void search_for_Big_Tall_Cotton_Tee() throws Throwable {
	    // Write code here that turns the phrase above into concrete actions
	 
		EbayHomePageActionsobj.searchItems("big tall cotton tee");
	}
	
	

	@When("^Mouse Hover to MyEbay Summary$")
	public void mouse_Hover_to_MyEbay_Summary() throws Throwable {
	    // Write code here that turns the phrase above into concrete actions
		EbayHomePageActionsobj.mouseHoverMyEbay();   
	}
	
	@Then("^Click on Summary$")
	public void click_on_Summary() throws Throwable {
	    // Write code here that turns the phrase above into concrete actions
	 
		EbayHomePageActionsobj.clickSummary();
	}


	
	
}
