CustomOrder.Order = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
			currentDayOption: 1,
			currentPackage: 1,
			currentStep: 0,
			days: 3,
			juiceSelections: this.makePackage(1, 3),
			lastStep: 0
		}
	},

	nextStep: function (event) {
		event.preventDefault()
		var currentStep = this.state.currentStep + 1
		var lastStep = (currentStep >= this.state.lastStep) ? currentStep : this.state.lastStep
		console.log("Moving to the next step: " + currentStep)
		this.setState({
			currentStep: currentStep,
			lastStep: lastStep
		}, this.updateOrder)
	},

	setStep: function (step) {
		if (this.state.lastStep >= step) {
			console.log("Setting current step to " + step)
			this.setState({
				currentStep: step
			})
		}
	},

	makePackage: function (packageID, days) {
		var self = this
		var juiceSelections = []

		var getJuice = function (juice) {
			return juice.Name == self.props.data.packages[packageID]["Drink" + juiceIndex]
		}
		var packageLength = self.props.data.packages[packageID].Length
		console.log('packageLength',packageLength)

		for ( dayIndex = 0; dayIndex < days; dayIndex++ ) {
			var dayJuices = []
			for ( juiceIndex = 1; juiceIndex <= packageLength; juiceIndex++ ) {
				dayJuices[juiceIndex - 1] = _.find(self.props.data.juices, getJuice)
			}
			juiceSelections[dayIndex] = dayJuices
		}
		
		return juiceSelections
	},

	updateDays: function (args) {
		console.log("Updating the number of days to " + args.days)
		this.setState({
			currentDayOption: args.currentDayOption,
			days: args.days,
			juiceSelections: this.makePackage(this.state.currentPackage, args.days)
		}, this.updateOrder)
	},

	updatePackage: function (currentPackage) {
		var self = this
		console.log("Updating the default package to " + self.props.data.packages[currentPackage].Name)
		this.setState({
			currentPackage: currentPackage,
			juiceSelections: this.makePackage(currentPackage, this.state.days)
		}, this.updateOrder)
	},

	updateJuiceSelections: function (day, juiceIndex, juice) {
		console.log("Changing day " + day + " and bottle " + juiceIndex + " to " + juice.Name)
		var juiceSelections = this.state.juiceSelections
		juiceSelections[day][juiceIndex] = juice
		this.setState({
			juiceSelections: juiceSelections
		}, this.updateOrder)		
	},

	updateOrder: function () {
		var self = this
		// Get the base price based on number of days
		var price = this.props.data.settings[0].PricePerDay * this.state.days
		// Add price adjustments for custom juice selections
		var priceAdjust = 0
		var orderDescription = "Package: " + self.props.data.packages[self.state.currentPackage].Name + "\n\nJuice Selections2\n\n"
		_.each(self.state.juiceSelections, function (juiceDay, dayIndex) {
			orderDescription += "Day " + (dayIndex + 1) + ": "
			var juiceList = []
			_.each(juiceDay, function (juice, index) {
				var juicePriceAdjust = Number(juice.Adjust.replace(/[^0-9\.]+/g,""))
				var juicePriceAdjustString = (juicePriceAdjust > 0) ? " (+$" + juicePriceAdjust + ")" : ""
				priceAdjust += Number(juice.Adjust.replace(/[^0-9\.]+/g,""))
				juiceList[index - 1] = juice.Name + juicePriceAdjustString
			})
			orderDescription += juiceList.join(", ") + "\n\n"
		})
		price += priceAdjust
		console.log(orderDescription)
		this.props.updateOrder( price, 1, orderDescription )
	},

	render: function () {
		var props = {
			data: this.props.data
		}

		var stepViews = [
			<CustomOrder.Days key="Days" {...props} days={this.state.days} currentDayOption={this.state.currentDayOption} updateDays={this.updateDays} nextStep={this.nextStep} />,
			<CustomOrder.Packages key="Packages" {...props} currentPackage={this.state.currentPackage} updatePackage={this.updatePackage} nextStep={this.nextStep} />,
			<CustomOrder.Customize key="Customize" {...props} days={this.state.days} currentPackage={this.state.currentPackage} juiceSelections={this.state.juiceSelections} updateJuiceSelections={this.updateJuiceSelections} nextStep={this.props.completeOrder} />
		]

		return (
			<div className="Order">
				<CustomOrder.Navigation step={this.state.currentStep} setStep={this.setStep} />
				<ReactCSSTransitionGroup transitionName="step" className="StepViews" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
					{stepViews[this.state.currentStep]}
				</ReactCSSTransitionGroup>
			</div>
		)
	}
})

CustomOrder.Navigation = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
		}
	},

	render: function () {
		var self = this
		var steps = [
			{ className: "days", label: "No. of Days" },
			{ className: "package", label: "Cleanse Package" },
			{ className: "customize", label: "Customize" },
			{ className: "complete", label: "Review & Place Order" }
		]
		var stepNodes = _.map(steps, function (step, index) {
			var classes = [
				"mw-step",
				(self.props.step == index) ? "selected" : null,
				(self.props.step > index) ? "completed" : null,
				step.className
			].join(" ")
			var styles = {
				width: (100 / steps.length) + "%"
			}
			return <li key={"Step" + index} style={styles} className={classes} onClick={self.props.setStep.bind(null, index)}><span>{step.label}</span></li>
		})
		var progressStyle = {
			width: ((100 / (steps.length - 1)) * self.props.step) + "%"
		}
		return (
			<div className="Navigation">
				<div className="mw-progress-bar">
					<div className="mw-progress" style={progressStyle}></div>
				</div>
				<ul className="mw-steps">
					{stepNodes}
				</ul>
			</div>
		)
	}
})

CustomOrder.Days = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
		}
	},

	updateDays: function (args, event) {
		var days = args.days
		if (args.days === "0") {
			days = parseInt(event.target.value)
			if (event.target.value !== "" && isNaN(days)) {
				days = 3
			}
		}
		this.props.updateDays({
			days: days,
			currentDayOption: args.currentDayOption
		})
	},

	render: function () {
		var self = this
		var dayOptions = _.map(this.props.data.days, function (dayOption, index) {
			var optionClasses = [
				"option",
				(self.props.currentDayOption == index) ? "selected" : null,
				(dayOption.Days === "0") ? "custom" : null
			].join(" ")
			var columns = "column column-small-6 column-medium-" + Math.floor(parseFloat(12 / self.props.data.days.length))
			var description
			if (dayOption.Days === "0") {
				description = (
					<div className="description">
						<input className="input" type="number" value={self.props.days} onChange={self.updateDays.bind(self,{ days: dayOption.Days, currentDayOption: index })} placeholder="Choose # of Days" />
					</div>
				)
			} else {
				description = <div className="description">{dayOption.Description}</div>
			}
			return (
				<div key={"days-" + dayOption.Days} className={columns}>
					<div className={optionClasses} onClick={self.updateDays.bind(self,{ days: dayOption.Days, currentDayOption: index })}>
						<div className="name">{dayOption.Name}</div>
						<div className="description">{description}</div>
					</div>
				</div>
			)
		})
		return (
			<div className="Days step-view">
				<header>
					<h3>How many days will you cleanse?</h3>
					<p className="instructions">The most popular is a 3-day cleanse, but even a 1-day cleanse will help detoxify your system. The 5-day will cleanse at deep cellular level. It typically takes 2 days to get over the detox symptoms.</p>
					<p className="pricing">$65/Day</p>
				</header>
				<main className="container">
					<div className="day-options mw-row">
						{dayOptions}
					</div>
				</main>
				<footer>
					<button onClick={this.props.nextStep}>Next Select Juices <i className="icon mk-moon-arrow-right-6"></i></button>
				</footer>
			</div>
		)
	}
})

CustomOrder.Packages = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
		}
	},

	updatePackage: function (currentPackage, event) {
		this.props.updatePackage(currentPackage)
	},

	render: function () {
		var self = this
		var groups = _.map(this.props.data.groups, function (group, index) {
			var styles = {
				backgroundColor: group.Color,
				border: (parseInt(group.Color.replace("#", "0x")) > parseInt("0xEEEEEE")) ? "1px solid #ccc" : "1px transparent"
			}
			if (index > 0) {
				return (
					<div key={"Group" + index} className="group">
						<span className="color" style={styles}></span>
						<span className="mw-label">{group.Description}</span>
					</div>
				)
			}
		})
		var packageOptions = _.map(this.props.data.packages, function (packageOption, index) {
			var packageGroups,
				packageGroupItems = [],
				packageBackgroundStyle = {}
			var predicate = function (group) { return group.Name == packageOption["Group" + (i+1)] }
			var packageLength = packageOption.Length
			console.log('packageLenth', packageLenth)
			for (i=0; i < packageLength; i++) {
				var groupDetails = _.find(self.props.data.groups, predicate)
				var styles = {
					backgroundColor: groupDetails.Color,
					border: (parseInt(groupDetails.Color.replace("#", "0x")) > parseInt("0xEEEEEE")) ? "1px solid #ccc" : "1px transparent"
				}
				packageGroupItems[i] = <span key={"PackageGroup" + i} className="package-group" style={styles}></span>
			}
			if (packageOption.Name !== "Custom") {
				packageGroups = (
					<div className="package-groups">
						<span className="mw-label">Includes:</span>
						{packageGroupItems}
					</div>
				)
			} else {
				packageGroups = (
					<div className="package-groups">&nbsp;</div>
				)
			}
			if (packageOption.Image !== "") {
				packageBackgroundStyle = {
					backgroundImage: "url(" + packageOption.Image + ")"
				}
			}
			var optionClasses = [
				"option",
				(self.props.currentPackage == index) ? "selected" : null
			].join(" ")
			var columns = "column column-small-6 column-medium-" + Math.floor(parseFloat(12 / self.props.data.packages.length))
			var tagStyle = { backgroundImage: "url(" + packageOption.TagImage + ")" }
			return (
				<div key={"Package" + index} className={columns}>
					<div className="tag" style={tagStyle}></div>
					<div className={optionClasses} onClick={self.updatePackage.bind(self, index)}>
						<div className="information" style={packageBackgroundStyle}>
							<div className="name">{packageOption.Name}</div>
							<div className="description">{packageOption.Description}</div>
						</div>
						{packageGroups}
					</div>
				</div>
			)
		})
		return (
			<div className="Packages step-view">
				<header>
					<h3>Select your cleanse package</h3>
					<p className="instructions">These packages are great guides but have no fear you can customize as you go!</p>
				</header>
				<main className="container">
					<div className="package-options mw-row">
						{packageOptions}
					</div>
					<div className="group-legend">
						{groups}
					</div>
				</main>
			</div>
		)
	}
})

CustomOrder.Customize = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
			currentDay: 0
		}
	},

	updateCurrentDay: function (currentDay, event) {
		console.log("Displaying juices selections for day " + currentDay)
		this.setState({
			currentDay: currentDay
		})
	},

	render: function () {
		var self = this
		var dayViews = _.map(this.props.juiceSelections, function (dayJuices, index) {
			return (
				<CustomOrder.Customize.Day key={"DayView" + index} data={self.props.data} currentPackage={self.props.currentPackage} updateJuiceSelections={self.props.updateJuiceSelections} currentDay={self.state.currentDay} juiceSelections={dayJuices} />
			)
		})
		return (
			<div className="Customize step-view">
				<header>
					<h3>Customize your juice selections</h3>
					<p className="instructions">Go ahead and change it up to your liking, but just remember that the greens have the most detoxify capabilities.</p>
				</header>
				<main>
					<CustomOrder.Customize.Navigation {...this.props} currentDay={this.state.currentDay} updateCurrentDay={this.updateCurrentDay} />
					<ReactCSSTransitionGroup transitionName="day" className="DayViews">
						{dayViews[this.state.currentDay]}
					</ReactCSSTransitionGroup>
				</main>
				<footer>
					<button onClick={this.props.nextStep}>Review &amp; place order <i className="icon mk-moon-arrow-right-6"></i></button>
				</footer>
			</div>
		)
	}
})

CustomOrder.Customize.Navigation = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
		}
	},

	render: function () {
		var self = this
		var dayTabs = []
		for (dayIndex = 0; dayIndex < this.props.days; dayIndex++) {
			var classes = [
				"option",
				"column-small-4 column-medium-" + Math.floor(parseFloat(12 / this.props.days)),
				(dayIndex == this.props.currentDay) ? "selected" : null
			].join(" ")
			var styles = {
				"width": (100 / this.props.days) + "%"
			}
			dayTabs[dayIndex] = <div className={classes} style={styles} key={"DaySelector" + dayIndex} onClick={this.props.updateCurrentDay.bind(null, dayIndex)}>Day {dayIndex + 1}</div>
		}
		return (
			<div className="CustomizeNavigation mw-row">
				{dayTabs}
			</div>
		)
	}
})

CustomOrder.Customize.Day = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
		}
	},

	render: function () {
		var self = this
		var juiceViews = _.map(this.props.juiceSelections, function (currentJuice, index) {
			return (
				<CustomOrder.Customize.Juice data={self.props.data} currentDay={self.props.currentDay} currentPackage={self.props.currentPackage} updateJuiceSelections={self.props.updateJuiceSelections} currentJuice={currentJuice} juiceIndex={index} />
			)
		})
		return (
			<div key={"Day" + self.props.currentDay} className="CustomizeDay mw-row">
				<div className="selection-label"></div>
				{juiceViews}
			</div>
		)
	}
})

CustomOrder.Customize.Juice = React.createClass({

	componentDidMount: function () {
	},

	getInitialState: function () {
		return {
			showingOptions: false
		}
	},

	updateJuice: function (juiceName) {
		var self = this
		var juiceSelection = _.find(self.props.data.juices, function (juice) { return juice.Name == juiceName })
		this.toggleOptions()
		this.props.updateJuiceSelections(this.props.currentDay, this.props.juiceIndex, juiceSelection)
	},

	toggleOptions: function () {
		this.setState({
			showingOptions: this.state.showingOptions ? false : true
		}, function () {
			console.log("Toggling showingOptions to " + this.state.showingOptions)
		})
	},

	render: function () {
		var self = this
		var data = this.props.data
		var currentGroup = _.find(data.groups, function (group) { return group.Name == data.packages[self.props.currentPackage]["Group" + (self.props.juiceIndex + 1)] })
		var juiceOptions = _.map(_.filter(self.props.data.juices, function (juice) { return (juice.Group == currentGroup.Name) || currentGroup.Name == "All" }), function (juiceOption, index) {
			var classes = [
				"option"
			].join(" ")
			var priceAdjust = Number(juiceOption.Adjust.replace(/[^0-9\.]+/g,""))
			var priceAdjustString = (priceAdjust > 0) ? "(+$" + priceAdjust + ")" : null
			return (
				<li key={"JuiceOpion" + index} className={classes} onClick={self.updateJuice.bind(null, juiceOption.Name)}>{juiceOption.Name} {priceAdjustString}</li>
			)
		})
		var classes = [
			"Juice",
			self.state.showingOptions ? "show" : null
		].join(" ")
		return (
			<div className="column-small-4 column-medium-2">
				<div className={classes}>
					<div className="image" onClick={this.toggleOptions}><img src={this.props.currentJuice.Image} alt={this.props.currentJuice.Name} className="bottle" /></div>
					<div className="information">
						<div className="name">{this.props.currentJuice.Name}</div>
						<div className="ingredients">{this.props.currentJuice.Ingredients}</div>
					</div>
					<div className="juice-selector">
						<ul className="options">
							{juiceOptions}
						</ul>
					</div>
				</div>
			</div>
		)
	}
})
