Feature: Combat and Martial Maneuvers
  As a User
  I want to record Martial & Combat Maneuvers my characters have access to
  So that I don't forget to apply their modifiers and other effects

  Scenario: Combat Maneuvers
    Given I have my character sheet open
    When I open the Combat tab
    Then I should see the combat maneuvers in the maneuver table

  Scenario: Martial Maneuvers
    Given I have my character sheet open to the Combat Tab
    When I click "Add Martial Arts"
    Then a new Martial Maneuver should appear in the maneuver table
    And the Martial Maneuver should be open for editing

  Scenario: Rolling a Maneuver
    Given my character has a total OCV of 10
    When I roll the Disarm maneuver
    Then the Attack Roll dialog should open
    And the prompted OCV should be 8

  Scenario: Rolling Maneuvers with special effects on OCV
    Given my character has a total OCV of 10
    When I roll the Move Through maneuver
    Then the Attack Roll dialog should open
    And the prompted OCV should be 10
    But the dialog should have a modifier field labeled "-v/10 where v is my velocity in meters"

  Scenario: Activating Brace, Dodge, or Set
    Given I have a total DCV of 8
    When I activate the <maneuver> maneuver
    Then I should send a chat message saying I used <maneuver>
    And I should <have the effect>

    Examples: 
      | maneuver | have the effect                    |
      | brace    | temporarily have a DCV of 4        |
      | dodge    | temporarily have a DCV of 11       |
      | set      | have an indefinite +1 bonus to OCV |

  Scenario: DCV modifiers when using a maneuver
    Given I have a total DCV of 9
    When I use the Brace maneuver
    Then I should temporarily have a DCV of 5

  Scenario: Ending maneuver effects
    Given I have a temporary DCV penalty from the Shove maneuver
    When my next Phase starts
    Then I should no longer have a temporary DCV penalty

  Scenario: Manually cancelling maneuver effects
    Given I have a temporary DCV penalty from the Shove maneuver
    When I cancel the Shove effect
    Then I should no longer have a temporary DCV penalty
