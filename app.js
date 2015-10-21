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
        "Click the calculator in the top right corner.",
        "Excellent!! Now do some math.",

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

      $scope.moreThanMaxInput   = false
      $scope.moreThanMaxDisplay = false

      checkLength = function() {
        console.log("checkLength() invoked")
        $scope.moreThanMaxInput = ($scope.input.length > 13) ? true : false
        $scope.moreThanMaxDisplay = ($scope.display.length > 13) ? true : false 
      }


      // this function will have a side effect where it will check if the last call to submit has
      // created a decimal value that has filled up the display, ie. 52/6 = 8.6666666666666 in which
      // case the user would be locked out of future operations. So to address this, if the user wants
      // to continue to use the last submitted value and the value has a decimal remainder, this function
      // will chop down the decimal remainder portion of the value
      notTooManyInputCharacters = function() {
        console.log("notTooManyInputCharacters() invoked")
        // will check for < 16
        // if false will then check if more than 2 digits to the right of decimal and crop to 2 digits
        //return $scope.input.length < 16
        if ($scope.input.length < 16) return true
        if (!submitJustExecuted) {
          $scope.display = "Too many digits"
          return false // 16 characters and not the result of user hitting submit
        }
        // here we have 16 characters as the result of user hitting submit
        var decimal_index = $scope.input.indexOf('.')
        console.log("decimal_index = "+decimal_index)
        if (decimal_index == -1) return false // no fractional part
        var rhs_length = $scope.input.length - (decimal_index+1) // +1 take into account decimal itself
        var lhs_length = $scope.input.length - (rhs_length+1) // +1 take into account decimal itself
        console.log("rhs_length = "+rhs_length)
        console.log("lhs_length = "+lhs_length)
        var lhs = $scope.input.slice(0,lhs_length)
        var rhs = $scope.input.slice(lhs_length+1) // til the end
        console.log("lhs = "+lhs)
        console.log("rhs = "+rhs)
        if (lhs_length >= 8) { 
          $scope.input = lhs // more than 8 characters in lhs, then just send back lhs
        } else {
            $scope.input = lhs + '.' + rhs.slice(0,8-lhs_length)
        }
        checkLength() // just in case
        return true
      }

      $scope.clear = function() {
        $scope.moreThanMaxInput = false  // are these needed here
        $scope.moreThanMaxDisplay = false
        $scope.input     = ''   // display zeroed out in all_false()
        all_false()
        openParenCount   = 0
        decimalEntered   = false
        console.log($scope.input)
        console.log(history)
        history = []
        checkLength()
      }

      $scope.number = function(value) {          
        console.log("number("+value+") invoked")
        if (notTooManyInputCharacters()) {
          if (submitJustExecuted) { // user wants to ignore result from previous submit
            $scope.clear()
          }
          if (!parenJustClosed) {  // prevent following case: (1+2) 4         
            history.push("$scope.number("+value+")")
            if (acceptingNumber) { // this is not the first digit
              $scope.input += value        
            } else { // first digit          
              $scope.input += value
            }
            all_false()
            acceptingNumber  = true
            console.log($scope.input)
          }
          checkLength()
        }
      }



      $scope.operator = function(value) {
          
// what about acceptingNumber not asserted, what will happen
        
        console.log("operator("+value+") invoked")
        if (notTooManyInputCharacters()) {
          if (acceptingNumber || parenJustClosed) { // end of the number
            history.push("$scope.operator('"+value+"')")
            //if (value == '/') value = '\367' //this works for display but not for eval, so i would need to build an eval
            // version, same for multiply if i choose a different icon that *
            $scope.input += value
            all_false() 
            operatorAccepted = true
          } 
          console.log($scope.input)
          checkLength()
        }
      }

      $scope.decimalPoint = function() {
               
        console.log("$scope.decimalPoint() invoked")
        if (notTooManyInputCharacters()) {
          if (submitJustExecuted) { // user wants to ignore result from previous submit
            $scope.clear()
          }  
          // sometimes . will not be valid given the context - not valid if number already has a decimal
          if (!parenJustClosed) { // prevent following case: (3+4) 0.
            history.push("$scope.decimalPoint()") 
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
          checkLength()
        }
      }
      
      $scope.paren = function() {
        if (notTooManyInputCharacters()) {
          history.push("$scope.paren()") // paren is always accepted
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
          checkLength()
        }
      }

      $scope.negative = function() {               
        console.log("negative() invoked")
        if (notTooManyInputCharacters()) {
          if (negativeJustExecuted) {
            console.log("Negative just executed. Remove last negative() call")
            $scope.backspace()
          } else {
            history.push("$scope.negative()")
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
          checkLength()
        }
      }

      // this function is needed to retain the state that submitJustExecuted was hit that would be lost
      // in the history if number() was directly invoked instead
      var submitNumber = function(value) {
        console.log("submitNumber() invoked")
        $scope.number(value)
        submitJustExecuted = true
      }

      $scope.submit = function() {               
        console.log("submit() invoked")
        if (notTooManyInputCharacters()) {
          // dont accept if just received an operator
          if (!operatorAccepted) { // prevent this case: 3 + submit OR ( 3 + submit => ( 3 + )
            // close open parens
            while (openParenCount) {
              console.log("before openParenCount = "+openParenCount)            
              $scope.paren() // paren() will decrement openParenCount
              console.log("after openParenCount = "+openParenCount)
            }
            $scope.display = $scope.input; // display shows the input of the previous operation, first time it is null
            $scope.input = eval($scope.input).toString() // convert to string for length check to function in checkLength()
            console.log("display = "+$scope.display)
            console.log("input = "+$scope.input)
            history = []
            history.push("submitNumber("+$scope.input+")")
            console.log(history)
            // no need for all_false() because parens above keeps state correct, and if no parens (ie simple number) we are in
            // good state already
            submitJustExecuted = true // this must be last, result is available to user if they enter an operator/parens
          }
          checkLength()
        }
      }      

      $scope.backspace = function() {
        console.log("backspace() invoked")
        history.pop()
        var keypresses = history
        history = []
        console.log(history)     
        keypresses.forEach(function(keypress) {
          console.log(keypress)
        })        
        $scope.clear()
        keypresses.forEach(function(keypress) {
          //console.log("$scope."+keypress)
          eval(keypress)
        })
        checkLength()
      }


      $scope.displayControl = function() {
        console.log("displayControl() invoked")
        $scope.controlDisplay = true
        $scope.event          = 1
        $scope.hoverMessage   = 'Use the calculator to have some fun'
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