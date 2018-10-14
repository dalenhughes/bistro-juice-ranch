jQuery(document).ready(function($) {
  // Forward the user to the cart after selection is made
  var cartlink = $(".woocommerce-message .wc-forward").attr("href");
  if (cartlink !== undefined) {
    window.location = cartlink;
  }

  $(".mw-custom-order").each(function(index) {
    var $self = $(this);

    console.log(
      "Custom product order builder initialized: " + $self.attr("id")
    );

    // Add the top-level React object
    ReactDOM.render(
      React.createElement(CustomOrder, {
        form: $self.parents("form"),
        data: CustomOrderData[$self.attr("id")],
        updateTotal: function(total, formId) {
          // Add advanced calculations for final total
          return total;
        }
      }),
      $self.get(0)
    );
  });
});
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var CustomOrder = React.createClass({
  displayName: "CustomOrder",

  componentDidMount: function() {
    var self = this;
    if (typeof gform == "object") {
      gform.addFilter("gform_product_total", self.props.updateTotal);
    }
    this.updateGravityForm();
  },

  getInitialState: function() {
    return {
      price: 0,
      quantity: 0,
      details: "",
      gravityForm: {
        form: this.props.form,
        price: this.props.form.find(".gf-product-price input"),
        details: this.props.form.find(".gf-product-details textarea")
      }
    };
  },

  completeOrder: function() {
    this.props.form.find('input[type="submit"]').click();
  },

  updateOrder: function(price, quantity, details) {
    this.setState(
      {
        price: price,
        quantity: quantity,
        details: details
      },
      this.updateGravityForm
    );
  },

  updateGravityForm: function() {
    console.log("Updating Gravity Form");
    var form = this.state.gravityForm;
    form.details.val(this.state.details);
    form.price.val(this.state.price).change();
  },

  render: function() {
    // Set up the child props
    var props = {
      price: this.state.price,
      quantity: this.state.quantity,
      details: this.state.details,
      data: this.props.data,
      completeOrder: this.completeOrder,
      updateOrder: this.updateOrder
    };

    return React.createElement(
      "div",
      { className: "CustomOrder" },
      React.createElement(CustomOrder.Summary, React.__spread({}, props)),
      React.createElement(CustomOrder.Order, React.__spread({}, props))
    );
  }
});

CustomOrder.Order = React.createClass({
  displayName: "Order",

  componentDidMount: function() {},

  getInitialState: function() {
    return {
      currentDayOption: 1,
      currentPackage: 1,
      currentStep: 0,
      days: 3,
      juiceSelections: this.makePackage(1, 3),
      lastStep: 0
    };
  },

  nextStep: function(event) {
    event.preventDefault();
    var currentStep = this.state.currentStep + 1;
    var lastStep =
      currentStep >= this.state.lastStep ? currentStep : this.state.lastStep;
    console.log("Moving to the next step: " + currentStep);
    this.setState(
      {
        currentStep: currentStep,
        lastStep: lastStep
      },
      this.updateOrder
    );
  },

  setStep: function(step) {
    if (this.state.lastStep >= step) {
      console.log("Setting current step to " + step);
      this.setState({
        currentStep: step
      });
    }
  },

  makePackage: function(packageID, days) {
    var self = this;
    var juiceSelections = [];

    var getJuice = function(juice) {
      return (
        juice.Name == self.props.data.packages[packageID]["Drink" + juiceIndex]
      );
    };
    var packageLength = self.props.data.packages[packageID].Length;
    for (dayIndex = 0; dayIndex < days; dayIndex++) {
      var dayJuices = [];
      for (juiceIndex = 1; juiceIndex <= packageLength; juiceIndex++) {
        dayJuices[juiceIndex - 1] = _.find(self.props.data.juices, getJuice);
      }
      juiceSelections[dayIndex] = dayJuices;
    }

    return juiceSelections;
  },

  updateDays: function(args) {
    console.log("Updating the number of days to " + args.days);
    this.setState(
      {
        currentDayOption: args.currentDayOption,
        days: args.days,
        juiceSelections: this.makePackage(this.state.currentPackage, args.days)
      },
      this.updateOrder
    );
  },

  updatePackage: function(currentPackage) {
    var self = this;
    console.log(
      "Updating the default package to " +
        self.props.data.packages[currentPackage].Name
    );
    this.setState(
      {
        currentPackage: currentPackage,
        juiceSelections: this.makePackage(currentPackage, this.state.days)
      },
      this.updateOrder
    );
  },

  updateJuiceSelections: function(day, juiceIndex, juice) {
    console.log(
      "Changing day " + day + " and bottle " + juiceIndex + " to " + juice.Name
    );
    var juiceSelections = this.state.juiceSelections;
    juiceSelections[day][juiceIndex] = juice;
    this.setState(
      {
        juiceSelections: juiceSelections
      },
      this.updateOrder
    );
  },

  updateOrder: function() {
    var self = this;
    // Get the base price based on number of days
    var price = this.props.data.settings[0].PricePerDay * this.state.days;
    // Add price adjustments for custom juice selections
    var priceAdjust = 0;
    var orderDescription =
      "Package: " +
      self.props.data.packages[self.state.currentPackage].Name +
      "\n\nJuice Selections\n\n";
    _.each(self.state.juiceSelections, function(juiceDay, dayIndex) {
      orderDescription += "Day " + (dayIndex + 1) + ": ";
      var juiceList = [];
      _.each(juiceDay, function(juice, index) {
        var juicePriceAdjust = Number(juice.Adjust.replace(/[^0-9\.]+/g, ""));
        var juicePriceAdjustString =
          juicePriceAdjust > 0 ? " (+$" + juicePriceAdjust + ")" : "";
        priceAdjust += Number(juice.Adjust.replace(/[^0-9\.]+/g, ""));
        juiceList[index - 1] = juice.Name + juicePriceAdjustString;
      });
      orderDescription += juiceList.join(", ") + "\n\n";
    });
    price += priceAdjust;
    console.log(orderDescription);
    this.props.updateOrder(price, 1, orderDescription);
  },

  render: function() {
    var props = {
      data: this.props.data
    };

    var stepViews = [
      React.createElement(
        CustomOrder.Days,
        React.__spread({ key: "Days" }, props, {
          days: this.state.days,
          currentDayOption: this.state.currentDayOption,
          updateDays: this.updateDays,
          nextStep: this.nextStep
        })
      ),
      React.createElement(
        CustomOrder.Packages,
        React.__spread({ key: "Packages" }, props, {
          currentPackage: this.state.currentPackage,
          updatePackage: this.updatePackage,
          nextStep: this.nextStep
        })
      ),
      React.createElement(
        CustomOrder.Customize,
        React.__spread({ key: "Customize" }, props, {
          days: this.state.days,
          currentPackage: this.state.currentPackage,
          juiceSelections: this.state.juiceSelections,
          updateJuiceSelections: this.updateJuiceSelections,
          nextStep: this.props.completeOrder
        })
      )
    ];

    return React.createElement(
      "div",
      { className: "Order" },
      React.createElement(CustomOrder.Navigation, {
        step: this.state.currentStep,
        setStep: this.setStep
      }),
      React.createElement(
        ReactCSSTransitionGroup,
        {
          transitionName: "step",
          className: "StepViews",
          transitionEnterTimeout: 500,
          transitionLeaveTimeout: 300
        },
        stepViews[this.state.currentStep]
      )
    );
  }
});

CustomOrder.Navigation = React.createClass({
  displayName: "Navigation",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  render: function() {
    var self = this;
    var steps = [
      { className: "days", label: "No. of Days" },
      { className: "package", label: "Cleanse Package" },
      { className: "customize", label: "Customize" },
      { className: "complete", label: "Review & Place Order" }
    ];
    var stepNodes = _.map(steps, function(step, index) {
      var classes = [
        "mw-step",
        self.props.step == index ? "selected" : null,
        self.props.step > index ? "completed" : null,
        step.className
      ].join(" ");
      var styles = {
        width: 100 / steps.length + "%"
      };
      return React.createElement(
        "li",
        {
          key: "Step" + index,
          style: styles,
          className: classes,
          onClick: self.props.setStep.bind(null, index)
        },
        React.createElement("span", null, step.label)
      );
    });
    var progressStyle = {
      width: (100 / (steps.length - 1)) * self.props.step + "%"
    };
    return React.createElement(
      "div",
      { className: "Navigation" },
      React.createElement(
        "div",
        { className: "mw-progress-bar" },
        React.createElement("div", {
          className: "mw-progress",
          style: progressStyle
        })
      ),
      React.createElement("ul", { className: "mw-steps" }, stepNodes)
    );
  }
});

CustomOrder.Days = React.createClass({
  displayName: "Days",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  updateDays: function(args, event) {
    var days = args.days;
    if (args.days === "0") {
      days = parseInt(event.target.value);
      if (event.target.value !== "" && isNaN(days)) {
        days = 3;
      }
    }
    this.props.updateDays({
      days: days,
      currentDayOption: args.currentDayOption
    });
  },

  render: function() {
    var self = this;
    var dayOptions = _.map(this.props.data.days, function(dayOption, index) {
      var optionClasses = [
        "option",
        self.props.currentDayOption == index ? "selected" : null,
        dayOption.Days === "0" ? "custom" : null
      ].join(" ");
      var columns =
        "column column-small-6 column-medium-" +
        Math.floor(parseFloat(12 / self.props.data.days.length));
      var description;
      if (dayOption.Days === "0") {
        description = React.createElement(
          "div",
          { className: "description" },
          React.createElement("input", {
            className: "input",
            type: "number",
            value: self.props.days,
            onChange: self.updateDays.bind(self, {
              days: dayOption.Days,
              currentDayOption: index
            }),
            placeholder: "Choose # of Days"
          })
        );
      } else {
        description = React.createElement(
          "div",
          { className: "description" },
          dayOption.Description
        );
      }
      return React.createElement(
        "div",
        { key: "days-" + dayOption.Days, className: columns },
        React.createElement(
          "div",
          {
            className: optionClasses,
            onClick: self.updateDays.bind(self, {
              days: dayOption.Days,
              currentDayOption: index
            })
          },
          React.createElement("div", { className: "name" }, dayOption.Name),
          React.createElement("div", { className: "description" }, description)
        )
      );
    });
    return React.createElement(
      "div",
      { className: "Days step-view" },
      React.createElement(
        "header",
        null,
        React.createElement("h3", null, "How many days will you cleanse?"),
        React.createElement(
          "p",
          { className: "instructions" },
          "The most popular is a 3-day cleanse, but even a 1-day cleanse will help detoxify your system. The 5-day will cleanse at deep cellular level. It typically takes 2 days to get over the detox symptoms."
        ),
        React.createElement("p", { className: "pricing" }, "$65/Day")
      ),
      React.createElement(
        "main",
        { className: "container" },
        React.createElement(
          "div",
          { className: "day-options mw-row" },
          dayOptions
        )
      ),
      React.createElement(
        "footer",
        null,
        React.createElement(
          "button",
          { onClick: this.props.nextStep },
          "Next Select Juices ",
          React.createElement("i", { className: "icon mk-moon-arrow-right-6" })
        )
      )
    );
  }
});

CustomOrder.Packages = React.createClass({
  displayName: "Packages",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  updatePackage: function(currentPackage, event) {
    this.props.updatePackage(currentPackage);
  },

  render: function() {
    var self = this;
    var groups = _.map(this.props.data.groups, function(group, index) {
      var styles = {
        backgroundColor: group.Color,
        border:
          parseInt(group.Color.replace("#", "0x")) > parseInt("0xEEEEEE")
            ? "1px solid #ccc"
            : "1px transparent"
      };
      if (index > 0) {
        return React.createElement(
          "div",
          { key: "Group" + index, className: "group" },
          React.createElement("span", { className: "color", style: styles }),
          React.createElement(
            "span",
            { className: "mw-label" },
            group.Description
          )
        );
      }
    });
    var packageOptions = _.map(this.props.data.packages, function(
      packageOption,
      index
    ) {
      var packageGroups,
        packageGroupItems = [],
        packageBackgroundStyle = {};
      var predicate = function(group) {
        return group.Name == packageOption["Group" + (i + 1)];
      };
      var packageLength = packageOption.Length;
      for (i = 0; i < packageLength; i++) {
        var groupDetails = _.find(self.props.data.groups, predicate);
        var styles = {
          backgroundColor: groupDetails.Color,
          border:
            parseInt(groupDetails.Color.replace("#", "0x")) >
            parseInt("0xEEEEEE")
              ? "1px solid #ccc"
              : "1px transparent"
        };
        packageGroupItems[i] = React.createElement("span", {
          key: "PackageGroup" + i,
          className: "package-group",
          style: styles
        });
      }
      if (packageOption.Name !== "Custom") {
        packageGroups = React.createElement(
          "div",
          { className: "package-groups" },
          React.createElement("span", { className: "mw-label" }, "Includes:"),
          packageGroupItems
        );
      } else {
        packageGroups = React.createElement(
          "div",
          { className: "package-groups" },
          " "
        );
      }
      if (packageOption.Image !== "") {
        packageBackgroundStyle = {
          backgroundImage: "url(" + packageOption.Image + ")"
        };
      }
      var optionClasses = [
        "option",
        self.props.currentPackage == index ? "selected" : null
      ].join(" ");
      var columns =
        "column column-small-6 column-medium-" +
        Math.floor(parseFloat(12 / self.props.data.packages.length));
      var tagStyle = { backgroundImage: "url(" + packageOption.TagImage + ")" };
      return React.createElement(
        "div",
        { key: "Package" + index, className: columns },
        React.createElement("div", { className: "tag", style: tagStyle }),
        React.createElement(
          "div",
          {
            className: optionClasses,
            onClick: self.updatePackage.bind(self, index)
          },
          React.createElement(
            "div",
            { className: "information", style: packageBackgroundStyle },
            React.createElement(
              "div",
              { className: "name" },
              packageOption.Name
            ),
            React.createElement(
              "div",
              { className: "description" },
              packageOption.Description
            )
          ),
          packageGroups
        )
      );
    });
    return React.createElement(
      "div",
      { className: "Packages step-view" },
      React.createElement(
        "header",
        null,
        React.createElement("h3", null, "Select your cleanse package"),
        React.createElement(
          "p",
          { className: "instructions" },
          "These packages are great guides but have no fear you can customize as you go!"
        )
      ),
      React.createElement(
        "main",
        { className: "container" },
        React.createElement(
          "div",
          { className: "package-options mw-row" },
          packageOptions
        ),
        React.createElement("div", { className: "group-legend" }, groups)
      )
    );
  }
});

CustomOrder.Customize = React.createClass({
  displayName: "Customize",

  componentDidMount: function() {},

  getInitialState: function() {
    return {
      currentDay: 0
    };
  },

  updateCurrentDay: function(currentDay, event) {
    console.log("Displaying juices selections for day " + currentDay);
    this.setState({
      currentDay: currentDay
    });
  },

  render: function() {
    var self = this;
    console.log("mapping", this.props.juiceSelections);
    var dayViews = _.map(this.props.juiceSelections, function(
      dayJuices,
      index
    ) {
      return React.createElement(CustomOrder.Customize.Day, {
        key: "DayView" + index,
        data: self.props.data,
        currentPackage: self.props.currentPackage,
        updateJuiceSelections: self.props.updateJuiceSelections,
        currentDay: self.state.currentDay,
        juiceSelections: dayJuices
      });
    });
    return React.createElement(
      "div",
      { className: "Customize step-view" },
      React.createElement(
        "header",
        null,
        React.createElement("h3", null, "Customize your juice selections"),
        React.createElement(
          "p",
          { className: "instructions" },
          "Go ahead and change it up to your liking, but just remember that the greens have the most detoxify capabilities."
        )
      ),
      React.createElement(
        "main",
        null,
        React.createElement(
          CustomOrder.Customize.Navigation,
          React.__spread({}, this.props, {
            currentDay: this.state.currentDay,
            updateCurrentDay: this.updateCurrentDay
          })
        ),
        React.createElement(
          ReactCSSTransitionGroup,
          { transitionName: "day", className: "DayViews" },
          dayViews[this.state.currentDay]
        )
      ),
      React.createElement(
        "footer",
        null,
        React.createElement(
          "button",
          { onClick: this.props.nextStep },
          "Review & place order ",
          React.createElement("i", { className: "icon mk-moon-arrow-right-6" })
        )
      )
    );
  }
});

CustomOrder.Customize.Navigation = React.createClass({
  displayName: "Navigation",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  render: function() {
    var self = this;
    var dayTabs = [];
    for (dayIndex = 0; dayIndex < this.props.days; dayIndex++) {
      var classes = [
        "option",
        "column-small-4 column-medium-" +
          Math.floor(parseFloat(12 / this.props.days)),
        dayIndex == this.props.currentDay ? "selected" : null
      ].join(" ");
      var styles = {
        width: 100 / this.props.days + "%"
      };
      dayTabs[dayIndex] = React.createElement(
        "div",
        {
          className: classes,
          style: styles,
          key: "DaySelector" + dayIndex,
          onClick: this.props.updateCurrentDay.bind(null, dayIndex)
        },
        "Day ",
        dayIndex + 1
      );
    }
    return React.createElement(
      "div",
      { className: "CustomizeNavigation mw-row" },
      dayTabs
    );
  }
});

CustomOrder.Customize.Day = React.createClass({
  displayName: "Day",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  render: function() {
    var self = this;
    var juiceViews = _.map(this.props.juiceSelections, function(
      currentJuice,
      index
    ) {
      return React.createElement(CustomOrder.Customize.Juice, {
        data: self.props.data,
        currentDay: self.props.currentDay,
        currentPackage: self.props.currentPackage,
        updateJuiceSelections: self.props.updateJuiceSelections,
        currentJuice: currentJuice,
        juiceIndex: index
      });
    });
    return React.createElement(
      "div",
      { key: "Day" + self.props.currentDay, className: "CustomizeDay mw-row" },
      React.createElement("div", { className: "selection-label" }),
      juiceViews
    );
  }
});

CustomOrder.Customize.Juice = React.createClass({
  displayName: "Juice",

  componentDidMount: function() {},

  getInitialState: function() {
    return {
      showingOptions: false
    };
  },

  updateJuice: function(juiceName) {
    var self = this;
    var juiceSelection = _.find(self.props.data.juices, function(juice) {
      return juice.Name == juiceName;
    });
    this.toggleOptions();
    this.props.updateJuiceSelections(
      this.props.currentDay,
      this.props.juiceIndex,
      juiceSelection
    );
  },

  toggleOptions: function() {
    this.setState(
      {
        showingOptions: this.state.showingOptions ? false : true
      },
      function() {
        console.log("Toggling showingOptions to " + this.state.showingOptions);
      }
    );
  },

  render: function() {
    var self = this;
    var data = this.props.data;
    var currentGroup = _.find(data.groups, function(group) {
      return (
        group.Name ==
        data.packages[self.props.currentPackage][
          "Group" + (self.props.juiceIndex + 1)
        ]
      );
    });
    var juiceOptions = _.map(
      _.filter(self.props.data.juices, function(juice) {
        return juice.Group == currentGroup.Name || currentGroup.Name == "All";
      }),
      function(juiceOption, index) {
        var classes = ["option"].join(" ");
        var priceAdjust = Number(juiceOption.Adjust.replace(/[^0-9\.]+/g, ""));
        var priceAdjustString =
          priceAdjust > 0 ? "(+$" + priceAdjust + ")" : null;
        return React.createElement(
          "li",
          {
            key: "JuiceOpion" + index,
            className: classes,
            onClick: self.updateJuice.bind(null, juiceOption.Name)
          },
          juiceOption.Name,
          " ",
          priceAdjustString
        );
      }
    );
    var classes = ["Juice", self.state.showingOptions ? "show" : null].join(
      " "
    );
    return React.createElement(
      "div",
      { className: "column-small-4 column-medium-2" },
      React.createElement(
        "div",
        { className: classes },
        React.createElement(
          "div",
          { className: "image", onClick: this.toggleOptions },
          React.createElement("img", {
            src: this.props.currentJuice.Image,
            alt: this.props.currentJuice.Name,
            className: "bottle"
          })
        ),
        React.createElement(
          "div",
          { className: "information" },
          React.createElement(
            "div",
            { className: "name" },
            this.props.currentJuice.Name
          ),
          React.createElement(
            "div",
            { className: "ingredients" },
            this.props.currentJuice.Ingredients
          )
        ),
        React.createElement(
          "div",
          { className: "juice-selector" },
          React.createElement("ul", { className: "options" }, juiceOptions)
        )
      )
    );
  }
});

CustomOrder.Summary = React.createClass({
  displayName: "Summary",

  componentDidMount: function() {},

  getInitialState: function() {
    return {};
  },

  render: function() {
    return React.createElement("div", { className: "Summary" });
  }
});
