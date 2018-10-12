var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

var CustomOrder = React.createClass({

	componentDidMount: function () {
		var self = this
		if (typeof gform == "object") {
			gform.addFilter("gform_product_total", self.props.updateTotal)
		}
		this.updateGravityForm()
	},

	getInitialState: function () {
		return {
			price: 0,
			quantity: 0,
			details: "",
			gravityForm: {
				form: this.props.form,
				price: this.props.form.find('.gf-product-price input'),
				details: this.props.form.find(".gf-product-details textarea"),
			}
		}
	},

	completeOrder: function () {
		this.props.form.find('input[type="submit"]').click()
	},

	updateOrder: function (price, quantity, details) {
		this.setState({
			price: price,
			quantity: quantity,
			details: details
		}, this.updateGravityForm)
	},

	updateGravityForm: function () {
		console.log("Updating Gravity Form")
		var form = this.state.gravityForm
		form.details.val(this.state.details)
		form.price.val(this.state.price).change()
	},

	render: function () {

		// Set up the child props
		var props = {
			price: this.state.price,
			quantity: this.state.quantity,
			details: this.state.details,
			data: this.props.data,
			completeOrder: this.completeOrder,
			updateOrder: this.updateOrder
		}

		return (
			<div className="CustomOrder">
				<CustomOrder.Summary  {...props} />
				<CustomOrder.Order  {...props} />
			</div>
		)
	}
})
