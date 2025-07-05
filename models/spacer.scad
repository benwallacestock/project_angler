$fa = 1;
$fs = 0.4;

difference() {
    cylinder(h = 2, r = 5.5);
    translate([0, 0, -0.001]) {
        cylinder(h=5 + 0.002, r=0.9);   
    }
  
    r = 3.5;
    for (i=[0:90:359]) {
        translate([r*cos(i),r*sin(i),-0.001])
            cylinder(h=5 + 0.002, r=0.72);   
    }
}