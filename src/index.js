jQuery(document).ready(function($) {

	// Forward the user to the cart after selection is made
	var cartlink = $(".woocommerce-message .wc-forward").attr("href")
	if (cartlink !== undefined) {
		window.location = cartlink
	}

	$(".mw-custom-order").each(function (index) {

		var $self = $(this)

		console.log("Custom product order builder initialized: " + $self.attr("id"))

		// Add the top-level React object
		ReactDOM.render(React.createElement(CustomOrder, {
			form: $self.parents("form"),
			data: CustomOrderData[$self.attr("id")],
			updateTotal: function (total, formId) {
				// Add advanced calculations for final total
				return total
			}
		}), $self.get(0))

	})

})