import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.awt.image.BufferedImage;



public class Viewer {

	public static void main(String[] args) {
		IOHandler favouriter = new IOHandler(); //IOHandler must be created before GUI is initialised as reading from file takes longer
		ViewerFrame viewerFrame = new ViewerFrame("Fractal Explorer", favouriter);
		viewerFrame.init();
	}

}

class ViewerFrame extends JFrame {
	JPanel viewerContainer;

	MandelbrotPanel mandelbrotPanel;
	MandelbrotControlPanel mandelbrotCtrlPanel;

	JuliaPanel juliaPanel;
	JuliaControlPanel juliaCtrlPanel;

	final Double DEFAULTXAXISSTART = -2.0;
	final Double DEFAULTXAXISEND = 2.0;
	final Double DEFAULTYAXISSTART = -1.6;
	final Double DEFAULTYAXISEND = 1.6;
	final int DEFAULTITERATIONS = 100;
	//These are the default values for the initial Mandelbrot set displayed

	Double realAxisStart = DEFAULTXAXISSTART;
	Double realAxisEnd = DEFAULTXAXISEND;
	Double imagAxisStart = DEFAULTYAXISSTART;
	Double imagAxisEnd = DEFAULTYAXISEND;
	int numberOfIterations = DEFAULTITERATIONS;
	//Variables that can be changed by the user within the GUI are initialized using the default values

	final static int MAXITERATIONS = 512;

	IOHandler favouriter; //The main window has a IOHandler object so it can interest with the IOHandler class and its methods.

	public ViewerFrame(String windowName, IOHandler favouriter){
		super(windowName);
		this.favouriter = favouriter;
	}

	public void init(){

		mandelbrotPanel = new MandelbrotPanel(); //JPanel consists entirely as a canvas for the Mandelbrot Set
		mandelbrotPanel.init();

		mandelbrotCtrlPanel = new MandelbrotControlPanel(); //JPanel which has the controls such as updating axis etc
		mandelbrotCtrlPanel.init();

		juliaPanel = new JuliaPanel(); //JPanel consists entire as a canvas for the Julia set to be displayed
		juliaPanel.init();

		juliaCtrlPanel = new JuliaControlPanel(); //Contains combo box to favorite Julia set and save images
		juliaCtrlPanel.init();

		viewerContainer = new JPanel();
		viewerContainer.setLayout(new BoxLayout(viewerContainer, BoxLayout.X_AXIS));
		viewerContainer.add(mandelbrotPanel);
		viewerContainer.add(juliaPanel);
		//Mandelbrot set image and Julia set images are displayed next to each other horizontally within viewerContainer

		JPanel ctrlContainer = new JPanel();
		ctrlContainer.setLayout(new BoxLayout(ctrlContainer, BoxLayout.X_AXIS));
		ctrlContainer.add(mandelbrotCtrlPanel);
		ctrlContainer.add(juliaCtrlPanel);
		//The two control panels are displayed next to each other horizontally within ctrlContainer

		Container panel = this.getContentPane();
		panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
		panel.add(viewerContainer);
		panel.add(ctrlContainer);
		//The Mandelbrot and julia set images sit vertically above the control panels within the container panel

		mandelbrotCtrlPanel.btnUpdate.addActionListener(new UpdateListener());
		mandelbrotCtrlPanel.btnReset.addActionListener(new ResetListener());
		ClickedOnImageListener clickedMandelbrot = new ClickedOnImageListener();
		mandelbrotPanel.addMouseListener(clickedMandelbrot);
		mandelbrotPanel.addMouseMotionListener(clickedMandelbrot);
		ZoomDragListener zoomDrag = new ZoomDragListener();
		mandelbrotPanel.addMouseListener(zoomDrag);
		mandelbrotPanel.addMouseMotionListener(zoomDrag);
		//All the listeners required are added to the components that require them

		this.setDefaultCloseOperation( JFrame.EXIT_ON_CLOSE);
		this.setSize(1200, 600);
		this.setMinimumSize(getSize());
		this.setMaximumSize(getSize());
		this.setVisible(true);

	}


	class MandelbrotPanel extends JPanel {

		private BufferedImage canvas; //Canvas is the BufferedImage in which the Mandelbrot set is displayed

		boolean dragging = false; //Dragging must always start at false.
		Rectangle currentRect; //Rectangle object & dragging used when user selects area to zoom in on with mouse.


		public MandelbrotPanel(){
			super();
		}

		public void init(){
			this.setPreferredSize(new Dimension(600, 500));
			this.setMinimumSize(new Dimension(600, 500));
			this.setMaximumSize(getMinimumSize());
			this.setBackground(Color.white);

		}

		public void paintComponent(Graphics g){
			super.paintComponent(g);

			if (dragging == true) {
				g.drawImage(canvas, 0, 0, null);
				g.setColor(Color.white);
				g.drawRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);

			} else {
				canvas = new BufferedImage(getWidth(), getHeight(), BufferedImage.TYPE_INT_ARGB);
				generateImage(canvas);
				g.drawImage(canvas, 0, 0, null);
			}

			/*
			 * If dragging is true it means the user is making a rectangular selection with their mouse
			 * within the event listener ZoomDragListener. When this happens the paintComponent method 
			 * puts the already drawn canvas on the JPanel (no recalculations are done) and a white rectangle
			 * with the coordinates the user has dragged to is drawn on screen. 
			 * 
			 * Else a new BufferedImage the size of the Panel (if resizing it turned on in future versions) is created.
			 * generateImage method performs the calculations to display the Mandelbrot set. Calls generateImage
			 * as rarely as possible. 
			 */

		}

		public void generateImage(BufferedImage image){
			Calculator calculator = new Calculator(numberOfIterations); //Calculator object needed for work out values and generate image

			int xWidth = this.getWidth();
			int yHeight = this.getHeight();

			/*
			 * Width and height of the JPanel are stored to be used to work out what Complex number each Pixel represents. 
			 */

			Double xReal; //Real number part of complex number 
			Double yImag; //Imaginary number part of complex number

			//Complex zConstant = new Complex(0.0, 0.0); Depreciated 

			for (int x = 0; x < xWidth; x++){
				for(int y = 0; y < yHeight; y++){
					xReal = this.translateXCord(x);
					yImag = this.translateYCord(y);

					/*
					 * Double for loop, one increments x pixel value and other increments y pixel value.
					 * Results the real number value and imaginary number value each pixel represents, dependent 
					 * on the user selected axis values, being calculated.
					 */

					Complex complex = new Complex(xReal, yImag); //A complex number object is created to represent each pixel.
					int iterTaken;

					iterTaken = calculator.calcIterations(complex); //Returns the number of iterations it takes to escape.

					if(iterTaken == numberOfIterations){
						canvas.setRGB(x, y, Color.black.getRGB());	//Complex numbers that do not escape are coloured black
					} else {
						double smooth = iterTaken + 1 - Math.log(Math.log(calculator.z.modulus())  / Math.log(2.0));
						double nsmooth = smooth / numberOfIterations; //Ensures it always a fraction.
						int rgb = Color.HSBtoRGB((float) (0.99f + 1.9 * nsmooth), 0.9f, 0.9f);
						canvas.setRGB(x, y, rgb);

						/*
						 * The smooth coloring algorithm is used. The hue, saturation and brightness can be tweaked to
						 * whatever is preferable for color. There is no specific reasoning behind the numbers, they are
						 * simply personal preference. 
						 */
					}

					calculator.resetCalculator(); //Calculator must be reset at the end of every calculation. 
				}
			}
		}

		public Double translateXCord(int xCord){
			Double xReal;
			int xWidth = getWidth();

			xReal = ((((realAxisEnd - realAxisStart) / xWidth) * xCord) + realAxisStart);

			return xReal;

			//Method returns the real number that a certain x coordinate on a Panel represents.

		}

		public Double translateYCord(int yCord){
			Double yImag;
			int yHeight = getHeight();

			yImag = ((((imagAxisStart - imagAxisEnd) / yHeight) * yCord) + imagAxisEnd);

			return yImag;

			//Method returns the imaginary number that a certain y coordinate on a Panel represents.

		}

	}

	class MandelbrotControlPanel extends JPanel {
		JTextField txtXAxisStart;
		JTextField txtXAxisEnd;
		JTextField txtYAxisStart;
		JTextField txtYAxisEnd;
		JTextField txtIterations;
		JButton btnUpdate;
		JButton btnReset;
		JLabel lblClickedNum;
		JLabel lblRealNumClicked;
		JLabel lblSign;
		JLabel lblImagNumClicked;
		JLabel lbli;
		JLabel lblNumberSelected;

		public MandelbrotControlPanel(){
			super();

		}

		public void init(){
			SpringLayout layout = new SpringLayout(); //Spring layout is used to specify exactly where each button is placed
			this.setLayout(layout);

			JLabel realNumLabel = new JLabel("Real Axis");
			this.add(realNumLabel);
			layout.putConstraint(SpringLayout.WEST, realNumLabel, 10, SpringLayout.WEST, this);
			layout.putConstraint(SpringLayout.NORTH, realNumLabel, 5, SpringLayout.NORTH, this);

			txtXAxisStart = new JTextField(3);
			this.add(txtXAxisStart);
			layout.putConstraint(SpringLayout.WEST, txtXAxisStart, 10, SpringLayout.WEST, this);
			layout.putConstraint(SpringLayout.NORTH, txtXAxisStart, 5, SpringLayout.SOUTH, realNumLabel);

			txtXAxisEnd = new JTextField(3);
			this.add(txtXAxisEnd);
			layout.putConstraint(SpringLayout.WEST, txtXAxisEnd, 0, SpringLayout.EAST, txtXAxisStart);
			layout.putConstraint(SpringLayout.NORTH, txtXAxisEnd, 5, SpringLayout.SOUTH, realNumLabel);

			JLabel imagNumLabel = new JLabel("Imaginary Axis");
			this.add(imagNumLabel);
			layout.putConstraint(SpringLayout.WEST, imagNumLabel, 55, SpringLayout.EAST, realNumLabel);
			layout.putConstraint(SpringLayout.NORTH, imagNumLabel, 5, SpringLayout.NORTH, this);

			txtYAxisStart = new JTextField(3);
			this.add(txtYAxisStart);
			layout.putConstraint(SpringLayout.WEST, txtYAxisStart, 10, SpringLayout.EAST, txtXAxisEnd);
			layout.putConstraint(SpringLayout.NORTH, txtYAxisStart, 5, SpringLayout.SOUTH, imagNumLabel);

			txtYAxisEnd = new JTextField(3);
			this.add(txtYAxisEnd);
			layout.putConstraint(SpringLayout.WEST, txtYAxisEnd, 0, SpringLayout.EAST, txtYAxisStart);
			layout.putConstraint(SpringLayout.NORTH, txtYAxisEnd, 5, SpringLayout.SOUTH, imagNumLabel);

			JLabel iterationsLabel = new JLabel("Iterations");
			this.add(iterationsLabel);
			layout.putConstraint(SpringLayout.WEST, iterationsLabel, 20, SpringLayout.EAST, imagNumLabel);
			layout.putConstraint(SpringLayout.NORTH, iterationsLabel, 5, SpringLayout.NORTH, this);

			txtIterations = new JTextField(3);
			this.add(txtIterations);
			layout.putConstraint(SpringLayout.WEST, txtIterations, 15, SpringLayout.EAST, txtYAxisEnd);
			layout.putConstraint(SpringLayout.NORTH, txtIterations, 5, SpringLayout.SOUTH, iterationsLabel);

			btnUpdate = new JButton("Update");
			this.add(btnUpdate);
			layout.putConstraint(SpringLayout.WEST, btnUpdate, 10, SpringLayout.EAST, txtIterations);
			layout.putConstraint(SpringLayout.NORTH, btnUpdate, 27, SpringLayout.NORTH, this);

			btnReset = new JButton("Reset");
			this.add(btnReset);
			layout.putConstraint(SpringLayout.WEST, btnReset, 0, SpringLayout.EAST, btnUpdate);
			layout.putConstraint(SpringLayout.NORTH, btnReset, 27, SpringLayout.NORTH, this);


			lblClickedNum = new JLabel("Selected Point");
			this.add(lblClickedNum);
			layout.putConstraint(SpringLayout.EAST, lblClickedNum, -5, SpringLayout.EAST, this);
			layout.putConstraint(SpringLayout.NORTH, lblClickedNum, 5, SpringLayout.NORTH, this);

			lblNumberSelected = new JLabel();
			this.add(lblNumberSelected);
			layout.putConstraint(SpringLayout.EAST, lblNumberSelected, -5, SpringLayout.EAST, this);
			layout.putConstraint(SpringLayout.NORTH, lblNumberSelected, 5, SpringLayout.SOUTH, lblClickedNum);

			this.setSize(600, 100);

			updateTextField(); //Method to populate textField with correct information from variables.
		}

		public void updateTextField(){
			txtXAxisStart.setText(String.format("%.2f", realAxisStart));
			txtXAxisEnd.setText(String.format("%.2f", realAxisEnd));
			txtYAxisStart.setText(String.format("%.2f", imagAxisStart));
			txtYAxisEnd.setText(String.format("%.2f", imagAxisEnd));
			txtIterations.setText(Integer.toString(numberOfIterations));

			//Actual values of axis' are set to 2 decimal places as they can potentially contain many figures.

		}

		public void updateNumberLabel(Complex selectedNumber){
			lblNumberSelected.setText(selectedNumber.toString());

		}
	}

	class JuliaPanel extends JPanel {

		private final Double REALXAXISSTART = -2.0;
		private final Double REALXAXISEND = 2.0;
		private final Double IMAGYAXISSTART = -1.6;
		private final Double IMAGYAXISEND = 1.6;
		//These values should not be changed hence they are private and final.

		Complex juliaConstant = new Complex(-0.5, 0.5);
		//Initial Julia Set displayed is of the complex number -0.5 + 0.5i

		private BufferedImage juliaCanvas;

		public JuliaPanel(){
			super();
		}

		public void init(){
			this.setPreferredSize(new Dimension(600, 500));
			this.setMinimumSize(getPreferredSize());
			this.setMaximumSize(getPreferredSize());

		}

		public void paintComponent(Graphics g){
			super.paintComponent(g);
			juliaCanvas = new BufferedImage(this.getWidth(), this.getHeight(), BufferedImage.TYPE_INT_ARGB);
			generateImage(juliaCanvas); //method used to perform calculations and generate the Julia Set
			g.drawImage(juliaCanvas, 0, 0, null);
		}

		public void generateImage(BufferedImage image){
			Calculator calculator = new Calculator(numberOfIterations, juliaConstant);
			//Calculator is told how many iterations to iterate to and the juliaConstant it is working with.

			int xWidth = this.getWidth();
			int yHeight = this.getHeight();

			Double xReal;
			Double yImag;

			for (int x = 0; x < xWidth; x++){
				for(int y = 0; y < yHeight; y++){
					xReal = this.translateXCord(x);
					yImag = this.translateYCord(y);

					Complex complex = new Complex(xReal, yImag); //Complex number that each pixel represents is calculated.

					int iterTaken = calculator.calculateJulia(complex); //Returns the number of iterations taken.

					if(iterTaken == numberOfIterations){
						juliaCanvas.setRGB(x, y, Color.black.getRGB());
					} else {
						double smooth = iterTaken + 1 - Math.log(Math.log(calculator.juliaD.modulus())  / Math.log(2.0));
						double nsmooth = smooth / numberOfIterations;
						int rgb = Color.HSBtoRGB((float) (0.49f + 1.9 * nsmooth), 0.9f, 0.9f);

						//Same smooth coloring as Mandelbrot set is used, however the numbers in the hue
						//values are tweaked to ensure the Julia set has a different color scheme compared to the
						//Mandelbrot set.

						juliaCanvas.setRGB(x, y, rgb);
					}
				}
			}
		}

		public Double translateXCord(int xCord){
			Double xReal;
			int xWidth = this.getWidth();

			xReal = ((((REALXAXISEND - REALXAXISSTART) / xWidth) * xCord) + REALXAXISSTART);

			return xReal;
		}

		public Double translateYCord(int yCord){
			Double yImag;
			int yHeight = this.getHeight();

			yImag = ((((IMAGYAXISSTART - IMAGYAXISEND) / yHeight) * yCord) + IMAGYAXISEND);

			return yImag;

		}

		public void changeJuliaConstant(Double xReal, Double yImag){
			juliaConstant.changeRealNum(xReal);
			juliaConstant.changeImagNum(yImag);

			repaint();

			/*
			 * When user clicks on a selected point in the Mandelbrot set the Julia constant
			 * is changed to reflect the point selected. Repaint is called to update the Julia Panel.
			 */
		}
	}


	class JuliaControlPanel extends JPanel {
		JButton btnFavourite;
		JButton btnSaveImage;
		JComboBox<Complex> comboJulia;

		public JuliaControlPanel(){
			super();

		}

		public void init(){
			SpringLayout layout = new SpringLayout();
			this.setLayout(layout);

			btnFavourite = new JButton("Add Favourite");
			btnFavourite.addActionListener(new FavouriteButtonListener()); //ActionListener added to button
			this.add(btnFavourite);

			btnSaveImage = new JButton("Save Image");
			btnSaveImage.addActionListener(new SaveImageListener()); //ActoinListener added to button
			this.add(btnSaveImage);

			//comboBox is filled with Complex numbers using the fillComboBox method from the IOHandler class.

			comboJulia = new JComboBox<Complex>(favouriter.fillComboBox());
			this.add(comboJulia);
			comboJulia.addActionListener(new ComboBoxListener());

			layout.putConstraint(SpringLayout.WEST, comboJulia, 200, SpringLayout.WEST, this);
			layout.putConstraint(SpringLayout.NORTH, comboJulia, 27, SpringLayout.NORTH, this);

			layout.putConstraint(SpringLayout.WEST, btnSaveImage, 0, SpringLayout.EAST, btnFavourite);
			layout.putConstraint(SpringLayout.NORTH, btnSaveImage, 27, SpringLayout.NORTH, this);

			layout.putConstraint(SpringLayout.WEST, btnFavourite, 0, SpringLayout.EAST, comboJulia);
			layout.putConstraint(SpringLayout.NORTH, btnFavourite, 27, SpringLayout.NORTH, this);

			juliaCtrlPanel.setSize(600, 100);
		}
	}


	class UpdateListener implements ActionListener{

		public UpdateListener(){}

		public void actionPerformed(ActionEvent e) {
			realAxisStart = Double.parseDouble(mandelbrotCtrlPanel.txtXAxisStart.getText());
			realAxisEnd = Double.parseDouble(mandelbrotCtrlPanel.txtXAxisEnd.getText());
			imagAxisStart = Double.parseDouble(mandelbrotCtrlPanel.txtYAxisStart.getText());
			imagAxisEnd = Double.parseDouble(mandelbrotCtrlPanel.txtYAxisEnd.getText());
			numberOfIterations = Integer.parseInt(mandelbrotCtrlPanel.txtIterations.getText());

			//The axis variables are set to whatever the user has entered into the textbox. 
			//The number of iterations variable is also updated to what is in inputed into the textbox txtIterations
			//provided it does not exceed the MAXITERATIONS variable. 

			mandelbrotCtrlPanel.updateTextField();

			mandelbrotPanel.repaint();
			juliaPanel.repaint();

		}
	}

	class ResetListener implements ActionListener {

		/*
		 * ResetListener resets the axis and numberOfIterations variables to their initially
		 * defined default values and then updates the Mandelbrot set image and Julia set image.
		 */


		public void actionPerformed(ActionEvent e) {
			realAxisStart = DEFAULTXAXISSTART;
			realAxisEnd = DEFAULTXAXISEND;
			imagAxisStart = DEFAULTYAXISSTART;
			imagAxisEnd = DEFAULTYAXISEND;
			numberOfIterations = DEFAULTITERATIONS;

			mandelbrotCtrlPanel.updateTextField();
			mandelbrotPanel.repaint();
			juliaPanel.repaint();

		}

	}
	class ClickedOnImageListener implements MouseListener, MouseMotionListener {
		int xCord;
		int yCord;
		Double xReal;
		Double yImag;
		boolean liveUpdates = false;


		public void mouseClicked(MouseEvent e) {
			this.xCord = e.getX();
			this.yCord = e.getY();

			liveUpdates = !liveUpdates; //toggle the liveUpdates variables. 

			xReal = mandelbrotPanel.translateXCord(xCord);
			yImag = mandelbrotPanel.translateYCord(yCord);

			juliaPanel.changeJuliaConstant(xReal, yImag); //change the JuliaSet displayed to correspond what user clicked on
			mandelbrotCtrlPanel.updateNumberLabel(new Complex(xReal, yImag)); //Update the label to display what user clicked on

		}

		public void mousePressed(MouseEvent e) {}

		public void mouseReleased(MouseEvent e) {}

		public void mouseEntered(MouseEvent e) {}

		public void mouseExited(MouseEvent e) {}

		public void mouseDragged(MouseEvent e) {}

		public void mouseMoved(MouseEvent e) {
			this.xCord = e.getX();
			this.yCord = e.getY();

			xReal = mandelbrotPanel.translateXCord(xCord);
			yImag = mandelbrotPanel.translateYCord(yCord);

			if (liveUpdates == true){
				juliaPanel.changeJuliaConstant(xReal, yImag);
				mandelbrotCtrlPanel.updateNumberLabel(new Complex(xReal, yImag));
			}

		}

		/*
		 * The mouse moveMoved method updates the JuliaSet buffered image continuously
		 * as the user moves the mouse around the Mandelbrot Panel providing the toggle variable
		 * liveUpdates is true. The label to show what Complex number the user is hovering over
		 * is also updated. 
		 */

	}

	class FavouriteButtonListener implements ActionListener {

		public void actionPerformed(ActionEvent e) {
			favouriter.addFavourite(juliaPanel.juliaConstant); //The juliaConstant Complex number is passed to addFavourite
			juliaCtrlPanel.comboJulia.addItem(favouriter.juliaFavs.get(favouriter.juliaFavs.size()-1));

			//The juliaConstant added to end of arraylist and the comboBox adds the last item in the arrayList

			favouriter.writeFavouritesClose(); //The newly added juliaConstant is written to the txt file. 
		}

	}

	class SaveImageListener implements ActionListener {

		public void actionPerformed(ActionEvent e) {
			favouriter.saveImage(juliaPanel.juliaConstant, juliaPanel.juliaCanvas);
		}
	}

	class ComboBoxListener implements ActionListener {

		public void actionPerformed(ActionEvent e) {
			JComboBox comboBox = (JComboBox) e.getSource();
			Complex favSelected = (Complex) comboBox.getSelectedItem();
			Double xReal = favSelected.getRealNum();
			Double yImag = favSelected.getImagNum();

			juliaPanel.changeJuliaConstant(xReal, yImag);

			mandelbrotCtrlPanel.updateNumberLabel(favSelected);
		}
	}

	class ZoomDragListener implements MouseListener, MouseMotionListener {
		int xCordStart;
		int yCordStart;
		int xCordEnd;
		int yCordEnd;

		Point startDrag;
		Point endDrag;



		public void mouseClicked(MouseEvent e) {
			mandelbrotPanel.dragging = false;

		}

		public void mousePressed(MouseEvent e) {
			xCordStart = e.getX();
			yCordStart = e.getY();

			startDrag = new Point(e.getX(), e.getY());
			endDrag = startDrag;

			mandelbrotPanel.dragging = true;

			/*
			 * Mouse pressed method is when user actually clicks and holds down the mouse.
			 * The starting co-ordinates are stored and the dragging variable is set to true
			 * as the user is about to begin dragging. 
			 */

		}


		public void mouseReleased(MouseEvent e) {
			xCordEnd = e.getX();
			yCordEnd = e.getY();

			if (xCordEnd == xCordStart && yCordStart == yCordEnd){
				return; //Checks that user has actually made a selection.
			}

			Double realAxisTmp = 0.0;
			Double realAxisEndTmp = 0.0;
			Double imagAxisTmp = 0.0;
			Double imagAxisEndTmp = 0.0;

			/*
			 * Temp variables are used because otherwise the realAxis and imaginary axis variables
			 * are changed where the line of code directly below them relies on the initial values.
			 */

			if (xCordEnd > xCordStart){
				realAxisTmp = mandelbrotPanel.translateXCord(xCordStart);
				realAxisEndTmp = mandelbrotPanel.translateXCord(xCordEnd);
			} else if (xCordStart > xCordEnd){
				realAxisTmp = mandelbrotPanel.translateXCord(xCordEnd);
				realAxisEndTmp = mandelbrotPanel.translateXCord(xCordStart);
			}

			if (yCordEnd > yCordStart){
				imagAxisTmp = mandelbrotPanel.translateYCord(yCordEnd);
				imagAxisEndTmp = mandelbrotPanel.translateYCord(yCordStart);
			} else if (yCordStart > yCordEnd){
				imagAxisTmp = mandelbrotPanel.translateYCord(yCordEnd);
				imagAxisEndTmp = mandelbrotPanel.translateYCord(yCordStart);
			}

			realAxisStart = realAxisTmp;
			realAxisEnd = realAxisEndTmp;
			imagAxisStart = imagAxisTmp;
			imagAxisEnd = imagAxisEndTmp;

			//Temporary values are stored in the actual axis variables once the co-ordinate translations are complete.

			mandelbrotPanel.dragging = false; //User has released mouse so is no longer dragging. 

			mandelbrotPanel.repaint();
			mandelbrotCtrlPanel.updateTextField();

			//Textfields are updated and the mandelbrotPanel is repainted to reflect the new zoomed in panel. 

		}


		public void mouseEntered(MouseEvent e) {}

		public void mouseExited(MouseEvent e) {}

		public void mouseDragged(MouseEvent e) {
			endDrag = new Point(e.getX(), e.getY());
			mandelbrotPanel.currentRect = makeRect(startDrag.x, endDrag.x, startDrag.y, endDrag.y);
			repaint();

			/*
			 * Co-ordinates of where the cursor is on the JPanel are stored in endDrag.
			 * A Rectangle object is returned from the method makeRect using the starting/ending x and y co-ordinates.
			 * The repaint method is called which results in a rectangle representing the users selection being drawn
			 * on the screen because the dragging variable is set to true. 
			 */
		}

		public void mouseMoved(MouseEvent e) {}

		public Rectangle makeRect(int xCord1, int xCord2, int yCord1, int yCord2){
			return new Rectangle(Math.min(xCord1, xCord2), Math.min(yCord1, yCord2), Math.abs(xCord1 - xCord2), Math.abs(yCord1 - yCord2));
			/*
			 * A new rectangle is created using the co-ordinates of the start and end drag of the users selection. 
			 * The Math.min and Math.abs functions are used so that users can make 'abnormal' selection such as dragging
			 * the mouse from the bottom right of the screen towards the top left. 
			 */
		}


	}
}


