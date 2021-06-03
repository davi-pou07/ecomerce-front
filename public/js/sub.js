
// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
'use strict'

// Fetch all the forms we want to apply custom Bootstrap validation styles to
var forms = document.querySelectorAll('.needs-validation')
// Loop over them and prevent submission
Array.prototype.slice.call(forms)

.forEach(function (form) {
  form.addEventListener('submit', function (event) {
  
    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
    }else{
      button = document.getElementById('buttom').setAttribute("disabled", "disabled");
    }
    form.classList.add('was-validated')
  }, false)

})
})()

// function sub(event, form) {
//   event.preventDefault()
//   titulo = document.getElementById('titulo').value
//   if (titulo == undefined || titulo == '') {
//       return false
//   } else {
//       button = document.getElementById('buttom').setAttribute("disabled", "disabled");
//       form.submit()
//       return true
//   }
// }
