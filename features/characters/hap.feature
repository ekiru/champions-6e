Feature: Heroic Action Points
  As a User
  I want to keep track of my HAP
  So that I can use them to improve my rolls

  Scenario: Rolling HAP at the start of a session
    Given I have my character sheet open
    When I click the Roll HAP button
    Then the system should roll 2d6
    And my HAP should equal the result of the roll

  Scenario: Spending HAP
    Given I have my character sheet open
    When I enter 5 into the HAP box
    Then my HAP should be 5
