package upskill.ebay.stepDef;

import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import upskill.api.restAssured.PetStoreRestAssuredActions;

public class petStoreApiSteps {

	PetStoreRestAssuredActions PetStoreRestAssuredActionsobj = new PetStoreRestAssuredActions(); 
	
	
	@Given("^Create pet$")
	public void create_pet() throws Throwable {
	  
		PetStoreRestAssuredActionsobj.createPet();
	}

	@When("^Update pet$")
	public void update_pet() throws Throwable {
		PetStoreRestAssuredActionsobj.updatePet();
	}

	@Then("^Get pet$")
	public void get_pet() throws Throwable {
		PetStoreRestAssuredActionsobj.updatePet();
	}

	@Then("^Delete pet$")
	public void delete_pet() throws Throwable {
		PetStoreRestAssuredActionsobj.deletePet();
	}


}
