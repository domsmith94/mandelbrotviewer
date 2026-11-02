public class Calculator {
	private int iterCount = 0;
	private int numberOfIterations;
	private final int VALUEOFDIVERGENCE = 2;
	public Complex z;
	public Complex c;
	public Complex juliaD;
	public Complex juliaConstant;

	public Calculator(int numberOfIterations){
		this.numberOfIterations = numberOfIterations; //Maximum number of iterations is specified 
		z = new Complex(0.0, 0.0); //Z is initially 0,0 for the Mandelbrot set calculation


	}

	public Calculator(int numberOfIterations, Complex juliaConstant){
		this.numberOfIterations = numberOfIterations;
		this.juliaConstant = juliaConstant;

		//Constructor used when generating julia set image. The complex number constant
		//that is being used to generate a julia set is passed to the calculator. 
	}

	public void resetCalculator(){
		z.resetConstant();
		this.iterCount = 0;

		//Calculator is reset after performing a calculation. (Like calculators in real life)
	}

	public int calcIterations(Complex c){
		this.c = c;
		return recursiveCalculation();

		//method used to Calculate mandelbrot set image. 
	}

	public int recursiveCalculation(){

		if (iterCount>=numberOfIterations || (z.modulusSquared() > (VALUEOFDIVERGENCE * VALUEOFDIVERGENCE))) {
			return iterCount;

		} else {
			z.square();
			z.add(c);
			iterCount ++;
			return this.recursiveCalculation();
		}

		//Method is run until the maximum number of iterations is reached or the complex number escapes. 

	}

	public int calculateJulia(Complex juliaD){
		this.juliaD = juliaD;
		iterCount = 1;
		return juliaRecursiveCalculation();

		//Method used to calculate the Julia set image. 
	}

	public int juliaRecursiveCalculation(){
		if (iterCount>=numberOfIterations || (juliaD.modulusSquared() > (VALUEOFDIVERGENCE * VALUEOFDIVERGENCE))) {
			return iterCount;
		} else {
			juliaD.square();
			juliaD.add(juliaConstant);
			iterCount ++;
			return this.juliaRecursiveCalculation();
		}

	}
}
