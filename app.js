///////////////////////////////////////////////////////////////////////////////////
//
// This is the first draft of this project.
// This project uses Angular.

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
// placed inside iife so we don't pollute with global namespace
(function() {

  
var app = angular.module("app", []);
  
  
app.controller("MainController", function($scope, $interval) {
  

  var messages = [
        "Click the tomato.",
        "Excellent!! Now use the calculator.",

      ]

  var current_state = 0
  $scope.message = messages[0]

      $interval(function(){       
        if (current_state <= 10) {          
          $scope.message = messages[current_state] // this line here causes an inherit one second pause which feels more normal
          if ($scope.event === current_state + 1) current_state+=1
        }
        console.log(current_state)
      }, 1000);       

});


app.directive('calculator', function() {
  return {
    replace:   false,
    restrict: 'E',
    scope: {
      event: '='
    },
    templateUrl: "calculator.html",
    controller: function($scope, $interval) {
      console.log("inside calculator controller")

 
      $scope.input   = '' // user input
      $scope.display = '' // user input after submit is entered by user, cleared after key entry
// could add DecimalPointJustEntered boolean to take care of this case 3.) 3.+


      // logic for accepting user input
      var decimalEntered   = false //this is carriend forward until no longer acceptingNumber so not part of all_false()
      var openParenCount   = 0
      var submitJustExecuted = false // when the user submits and how to handle the next command, either ignore history for number or user it for operator

      var acceptingNumber  = false
      var operatorAccepted = false
      var parenJustClosed  = false
      var parenJustOpened  = false
      var negativeJustExecuted = false

      var all_false = function() { // common code to reset state
        acceptingNumber  = false   // this is carried forward (but is always set in number) until the end of a number
        operatorAccepted = false   // not carried forward
        parenJustClosed  = false   // not carried forward
        parenJustOpened  = false   // not carrien forward
        submitJustExecuted = false // not carried forward
        negativeJustExecuted = false // not carried forward
        $scope.display   = ''      // turn off old display as user is entering new commands
      }

      var history          = []

      $scope.clear = function() {
        $scope.input     = ''
        all_false()
        openParenCount   = 0
        decimalEntered   = false
        console.log($scope.input)
        console.log(history)
        history = []
      }


      $scope.number = function(value) {          
          console.log("number("+value+") invoked")
          if (submitJustExecuted) { // user wants to ignore result from previous submit
            $scope.clear()
          }
          if (!parenJustClosed) {  // prevent following case: (1+2) 4         
            history.push("number("+value+")")
            if (acceptingNumber) { // this is not the first digit
              $scope.input += value        
            } else { // first digit          
              $scope.input += value
            }
            all_false()
            acceptingNumber  = true
            console.log($scope.input)
          }
      }


      $scope.operator = function(value) {
          
// what about acceptingNumber not asserted, what will happen

          console.log("operator("+value+") invoked")
          if (acceptingNumber || parenJustClosed) { // end of the number
            history.push("operator('"+value+"')")
            $scope.input += value
            all_false() 
            operatorAccepted = true
          } 
          console.log($scope.input)
      }

      $scope.decimalPoint = function() {
               
        console.log("decimalPoint() invoked")
        if (submitJustExecuted) { // user wants to ignore result from previous submit
          $scope.clear()
        }  
        // sometimes . will not be valid given the context - not valid if number already has a decimal
        if (!parenJustClosed) { // prevent following case: (3+4) 0.
          history.push("decimalPoint()") 
          if (!decimalEntered) { // only add a decimal if the number doesnt already have one
            if (acceptingNumber) { // not the first digit
              $scope.input += '.'
            } else { // first digit
               $scope.input += ' 0.'    
            }
            all_false()
            acceptingNumber = true
            decimalEntered = true
          }

        }        
      }
      
      $scope.paren = function() {
        history.push("paren()") // paren is always accepted
        if (openParenCount === 0) {
          console.log("Parens A")
          if (acceptingNumber || parenJustClosed) {  // 3( => 3*(  or (a+b)( => (a+b)*(
            console.log("Parens B")
            $scope.input += '*'
          }
          $scope.input += '('
          all_false()
          openParenCount = 1
          parenJustOpened = true
          decimalEntered  = false
        } else { // more open parens than closing parens
            if (acceptingNumber) {   // ( ...... 4567 )
              console.log("Parens C")
              $scope.input += ')'
              all_false()
              parenJustClosed = true
              decimalEntered  = false
              openParenCount -= 1
            } else if (parenJustOpened) {  // (( -> (( instead of ()  
                console.log("Parens E")
                $scope.input += '('
                all_false()
                parenJustOpened = true
                decimalEntered  = false
                openParenCount += 1
            } else if (operatorAccepted) // ( ...... 4567 + (
               {                 
                console.log("Parens D")
                $scope.input += '('
                all_false()
                parenJustOpened = true
                decimalEntered  = false
                openParenCount += 1
            } else { // ( 3 + (4 + 2) )   
                console.log("Parens F")
                $scope.input += ')'
                all_false()
                parenJustClosed = true
                decimalEntered  = false
                openParenCount -= 1
            }
        }

      }

      $scope.negative = function() {               
        console.log("negative() invoked")
        if (negativeJustExecuted) {
          console.log("Negative just executed. Remove last negative() call")
          $scope.backspace()
        } else {
          history.push("negative()")
          if (acceptingNumber || parenJustClosed) {  // 3( => 3*(  or (a+b)( => (a+b)*(
            console.log("Parens B")
            $scope.input += '*'
          }         
          $scope.input += '(-'
          all_false()
          parenJustOpened = true
          openParenCount += 1      
          negativeJustExecuted = true
        }
      }

      $scope.submit = function() {               
        console.log("submit() invoked")
        // dont accept if just received an operator
        if (!operatorAccepted) { // prevent this case: 3 + submit OR ( 3 + submit => ( 3 + )
          // close open parens
          while (openParenCount) {
            console.log("before openParenCount = "+openParenCount)            
            $scope.paren() // paren() will decrement openParenCount
            console.log("after openParenCount = "+openParenCount)
          }
          $scope.display = $scope.input; // display shows the input of the previous operation, first time it is null
          $scope.input = eval($scope.input)
          console.log("display = "+$scope.display)
          console.log("input = "+$scope.input)
          history = []
          history.push("number("+$scope.input+")")
          console.log(history)
          // no need for all_false() because parens above keeps state correct, and if no parens (ie simple number) we are in
          // good state already
          submitJustExecuted = true // this must be last, result is available to user if they enter an operator/parens
        }
      }      

      $scope.backspace = function() {
        console.log("backspace() invoked")
        history.pop()
        var keypresses = history
        history = []
        console.log("DRT")
        console.log(history)     
        keypresses.forEach(function(keypress) {
          console.log(keypress)
        })        
        $scope.clear()
        console.log("here")
        keypresses.forEach(function(keypress) {
          console.log("$scope."+keypress)
          eval("$scope."+keypress)
        })
      }


      $scope.displayControl = function() {
        console.log("displayControl() invoked")
        $scope.controlDisplay = true
        $scope.event          = 1
        $scope.hoverMessage   = 'Use the dashboard to start a task'
      }

      $scope.cancelControl = function() {
        console.log("cancelControl() invoked")
        $scope.controlDisplay = false
        $scope.event          = 8
        $scope.hoverMessage   = 'Click Me!'
      }


    }
  }
})  
 
  
}());