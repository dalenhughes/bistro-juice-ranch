<?php
/*
Plugin Name: Custom Order System for Juice Ranch
Plugin URI:  http://managedword.com
Description: Custom Order System for Gravity Forms
Version:     1.0
Author:      Managed Word <info@managedword.com> for Frazier Media
Author URI:  http://managedword.com
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
WC requires at least: 2.2
WC tested up to: 2.4.12
*/


/**
* Managed Word Custom Order Plugin for WordPress
* Retrieves pricing charts from public Google Sheets and generates an interactive order wizard.
*/
class MW_CustomOrder {

	protected $pluginPath;
	protected $pluginUrl;
	protected $feeds;

	public function __construct () {

		// Set up some basic values
		$this->pluginPath = dirname(__FILE__);
		$this->pluginUrl = plugin_dir_url(__FILE__);

		// Add callbacks
		add_action( 'wp_enqueue_scripts', array($this, 'enqueueScripts'));
		add_action( 'gform_enqueue_scripts', array($this, 'enqueueScripts'), 10, 2 );
		add_shortcode('mw_custom_order', array($this, 'displayCustomOrder'));
	
	}

	public function enqueueScripts () {
		wp_enqueue_script( 'react', 'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-with-addons.js', array(), '0.14.3' );
		wp_enqueue_script( 'react-dom', 'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-dom.js', array(), '0.14.3' );
		wp_enqueue_script( 'underscore', 'https://github.com/jashkenas/underscore/blob/1.8.3/underscore-min.js', array(), '1.8.3' );
		wp_enqueue_script( 'mw-custom-order-js', plugin_dir_url( __FILE__ ) . 'js/index.js', array('jquery', 'react', 'react-dom', 'underscore'), '1.0.0', true );
		wp_enqueue_style( 'mw-custom-order-css', plugin_dir_url( __FILE__ ) . 'css/styles.css' );
	}

	private function getFeed ($url) {

		// Check the transient cache for the feed
		if(false === ($csv = get_transient($url) ) ){

			// Get a new feed
			$response = wp_remote_get($url);
			$csv = $response['body'];

			// Set the transient with the CSV data for 10 minutes
			set_transient($url, $csv, 600);

		}

		return $csv;

	}

	private function parseCSV ($csv) {

		// Parse lines into array
		$lines = explode(PHP_EOL, $csv);

		// Pull the headers for keys		
		$header = str_getcsv(array_shift($lines));

		// CSV parse each line
		$array = array();
		foreach ($lines as $line) {

			// Get the values
			$values = str_getcsv($line);

			// Set key -> value pairs
			$value_array = array();

			for ($i=0; $i < count($values); $i++) {
				$value_array[$header[$i]] = $values[$i];
			}

		    $array[] = $value_array;

		}
		return $array;

	}

	public function displayCustomOrder ($attr, $content) {
		// Pull in attributes from the plugin
		$a = shortcode_atts( array(
			'id' => 'mw-custom-order',
			'feeds' => []
		), $attr );

		// Add data from CSV feeds if required
		$output = '<script type="text/javascript">';
		$output .= "var CustomOrderData = []\n";
		$output .= "CustomOrderData['" . $a['id'] . "'] = {}\n";
		$feeds = explode(",", $a['feeds']);
		foreach ($feeds as $feed) {
			$feed = explode("|", $feed);
			$key = $feed[0];
			$feed_url = $feed[1];
			$output .= 'CustomOrderData["' . $a['id'] . '"].' . $key . ' = ' . json_encode($this->parseCSV ($this->getFeed ($feed_url))) . "\n";
		}
		$output .= '</script>';

		// Write out the DIV we will attach the React object to
		$output .= '<div id="' . $a['id'] . '" class="mw-custom-order"></div>';

		return $output;

	}

}

$CustomOrder = new MW_CustomOrder();

