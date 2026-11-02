public class Complex {
	private Double realNum;
	private Double imagNum;

	//Complex number consists of a real number an an imaginary number. 


	public Complex(Double realNum, Double imagNum){
		this.realNum = realNum;
		this.imagNum = imagNum;

	}

	public Double getRealNum(){
		return realNum;
	}

	public Double getImagNum(){
		return imagNum;
	}

	public void changeRealNum(Double realNum){
		this.realNum = realNum;
	}

	public void changeImagNum(Double imagNum){
		this.imagNum = imagNum;
	}

	public void square(){
		Double initRealNum = realNum;
		Double initImagNum = imagNum;
		realNum = ((initRealNum * initRealNum) - (initImagNum * initImagNum));
		imagNum = ((initRealNum * initImagNum) + (initImagNum * initRealNum));

		//Method squares complex number. Note Math.square is not used for performance reasons. 

	}

	public Double modulusSquared(){
		Double modSquared;
		modSquared = ((realNum * realNum) + (imagNum * imagNum));
		return modSquared;

		//Returns the modulus of given complex number squared. Note Math.square is not used for performance reasons. 
	}

	public Double modulus(){
		Double modSquared = this.modulusSquared();
		Double mod = Math.sqrt(modSquared);
		return mod;

		//Returns the modulus of given complex number. Not used to calculate Mandelbrot set or Julia set
		//Used in smooth coloring algorithm. 
	}

	public void add(Complex d){
		this.realNum = this.realNum + d.getRealNum();
		this.imagNum = this.imagNum + d.getImagNum();
	}

	public void resetConstant(){
		this.imagNum = 0.00;
		this.realNum = 0.00;
	}

	public boolean isImagNegative(){
		if (this.imagNum < 0){
			return true;
		} else
			return false;

	}

	public void changeToAbsoluteValues(){
		this.realNum = Math.abs(realNum);
		this.imagNum = Math.abs(imagNum);
	}

	public String toString(){
		/*
		 * toString method overridden. Used to display complex numbers correctly in 
		 * comboBoxs and labels which only accept strings. Each complex number is 
		 * displayed to 2 decimal places along with a +/ sign and the letter i
		 * after the imaginary part of the complex number. 
		 */
		String returnString;

		if (this.isImagNegative() == true){
			returnString = String.format("%.2f", realNum) + " " + String.format("%.2f", imagNum) + "i";
		}	else {
			returnString = String.format("%.2f", realNum) + " + " + String.format("%.2f", imagNum) + "i";

		}


		return returnString;
	}

}



