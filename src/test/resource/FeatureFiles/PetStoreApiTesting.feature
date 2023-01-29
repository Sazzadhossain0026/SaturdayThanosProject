@regression @api

Feature: Petstore API Testing

Scenario: Pet CRUD API

Given Create pet
When Update pet
Then Get pet
And Delete pet