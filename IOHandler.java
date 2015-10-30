import java.awt.image.BufferedImage;
import java.io.*;
import java.util.ArrayList;
import javax.imageio.ImageIO;

public class IOHandler {
	BufferedReader reader;
	public ArrayList<Complex> juliaFavs; //ArrayList used to stored all saved julia complex numbers


	public IOHandler(){

		juliaFavs = new ArrayList<Complex>();


		try {
			reader  = new BufferedReader(new FileReader("savedFavourites.txt")); //reads from filed savedFavourites.txt
			this.readFavouritesStartUp(); 
		}  catch (FileNotFoundException e) {
			System.err.println("The file could not be found"); //Exception caught if there is a problem reading from file.
		}
	}

	public boolean isReady(){
		boolean isItReady = false;
		try {
			isItReady = reader.ready();
		} catch (IOException e) {
			System.out.println("There was a problem reading from the favourites file.");
		}

		return isItReady;

		/*
		 * This is used to check that the file is ready to read from. If it is the variable isItReady returns true
		 */
	}

	public String getLine(){
		String s = null;
		try {
			s = reader.readLine();
		} catch (IOException e) {
			System.err.println("There was a problem reading from the favourites file. ");
		}

		return s;

		/*
		 * This method is used the read each line from the specified BufferedReader input file. 
		 * If there are any problems the the exception is caught and a helpful error message is displayed
		 */

	}

	public void readFavouritesStartUp(){
		while(this.isReady()==true) { 
			try {
				String[] favouritedImages = this.getLine().split(":");
				juliaFavs.add(new Complex(Double.parseDouble(favouritedImages[0]),Double.parseDouble(favouritedImages[1])));
				
			} catch (NumberFormatException e){
			}
		}	

		/*
		 * Each line of the file is read and split on the : symbol. This allows both the real and imaginary parts of a complex
		 * number to be stored in the text file. Each complex number stored in the text file is then added to the arraylist
		 * juliaFavs and stored as a Complex object. 
		 */

	}

	public void writeFavouritesClose(){
		BufferedWriter writer = null;

		//This method is ued to save newly added Julia favorite images to the file savedFavourites.txt.

		try {
			writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("savedFavourites.txt"), "utf-8"));
			for(Complex element : juliaFavs){
				writer.write(Double.toString(element.getRealNum()) + ":" + Double.toString(element.getImagNum()));
				writer.newLine();
			}

			/*
			 * Every Complex number in the array list is written to the text file with the real number part
			 * and imaginary number part split by a semi colon. 
			 */
		} catch (IOException ex) {
			System.err.println("There was a problem writing to the file to save the favourites!");
		} finally {
			try {writer.close();} catch (Exception ex) {}
		}
	}

	public void addFavourite(Complex juliaNumber){
		juliaFavs.add(new Complex(juliaNumber.getRealNum(), juliaNumber.getImagNum()));
		this.fillComboBox();

		/*
		 * Complex number currently being displayed is added to the arraylist juliaFavs.
		 */
	}



	public Complex[] fillComboBox(){
		Complex[] complexStrings = new Complex[juliaFavs.size()];

		for (int i = 0; i < juliaFavs.size(); i++) {
			complexStrings[i] = juliaFavs.get(i);  
		}	

		return complexStrings;

		/*
		 * Method used to return a string array of all the Complex numbers in the juliaFavs
		 * array list. 
		 */
	}

	public void saveImage(Complex juliaNumber, BufferedImage juliaCanvas){

		try {
			File outputfile = new File(juliaNumber.toString() + ".png");
			ImageIO.write(juliaCanvas, "png", outputfile);
		} catch (IOException e) {
			System.err.println("There was a problem creating your file");

		}

		/*
		 * This method exports an image that is being viewed in the Julia panel to a png file
		 * in the default directory. The name of the file is the string representation of the complex
		 * number used in the Julia set e.g. 1.4 - 1.0i
		 */


	}

}
