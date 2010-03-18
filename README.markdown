# Peity

Peity (sounds like deity) is a simple jQuery plugin to create a mini pie chart from the contents of an element using canvas.

## Usage


### HTML

    &lt;span class="chart_1"&gt;2/10&lt;/span&gt; 
    &lt;span class="chart_2"&gt;4/10&lt;/span&gt; 
    &lt;span class="chart_3"&gt;5/10&lt;/span&gt; 

### Javascript (jquery)

    $(function(){
      $('span').peity();
    });

## Updating charts

Peity adds a "change" event trigger to your graph elements, so if you update their data your can regenerate one or more charts by triggering "change" on them.

   $('span#chart_1').html("5/10").trigger('change')
   
## Subscribing to chart updates

After drawing the chart, Peity elements will trigger the event 'peity:changed', passing current and maximum values as event arguments. This is useful if you want to "listen" to chart updates elsewhere in your code:

   $('span').bind('peity:changed', function(event, new_value, max_value){
     $('p#notice').html("Chart updated: " + new_value + " out of " + max_value);
   });
   
See a working example in examples/simple.html
    