$fa = 1;
$fs = 0.4;

difference() {
    cylinder(h = 5, r = 20);
    translate([0, 0, -0.001]) {
        cylinder(h=5 + 0.002, r=1.5);   
    }
  
    r = 15;
    for (i=[0:90:359]) {
        translate([r*cos(i),r*sin(i),-0.001])
            cylinder(h=5 + 0.002, r=1);   
    }
}