import java.util.Locale;
import java.util.Random;

/**
 * Emits golden escape-time results from the original (2014) Java Calculator so the
 * TypeScript port can be verified against it. Run with `npm run golden` from web/.
 */
public class GenerateGolden {
	public static void main(String[] args) {
		Locale.setDefault(Locale.ROOT);
		Random random = new Random(2014);
		int[] iterationLimits = {50, 100, 512};
		double[][] juliaConstants = {{-0.5, 0.5}, {-0.8, 0.156}, {0.285, 0.01}, {-0.4, 0.6}};

		StringBuilder out = new StringBuilder();
		out.append("{\n  \"mandelbrot\": [\n");
		boolean first = true;
		for (int i = 0; i < 400; i++) {
			double re = -2.2 + random.nextDouble() * 3.0;
			double im = -1.4 + random.nextDouble() * 2.8;
			for (int limit : iterationLimits) {
				Calculator calculator = new Calculator(limit);
				int iterations = calculator.calcIterations(new Complex(re, im));
				out.append(first ? "" : ",\n").append(String.format("    [%s, %s, %d, %d]", re, im, limit, iterations));
				first = false;
			}
		}
		out.append("\n  ],\n  \"julia\": [\n");
		first = true;
		for (double[] constant : juliaConstants) {
			for (int i = 0; i < 150; i++) {
				double re = -2.0 + random.nextDouble() * 4.0;
				double im = -1.6 + random.nextDouble() * 3.2;
				for (int limit : iterationLimits) {
					Calculator calculator = new Calculator(limit, new Complex(constant[0], constant[1]));
					int iterations = calculator.calculateJulia(new Complex(re, im));
					out.append(first ? "" : ",\n").append(String.format("    [%s, %s, %s, %s, %d, %d]", constant[0], constant[1], re, im, limit, iterations));
					first = false;
				}
			}
		}
		out.append("\n  ],\n  \"hsb\": [\n");
		first = true;
		for (int i = 0; i < 200; i++) {
			float hue = random.nextFloat() * 3.0f - 1.0f;
			float saturation = random.nextFloat();
			float brightness = random.nextFloat();
			int rgb = java.awt.Color.HSBtoRGB(hue, saturation, brightness);
			out.append(first ? "" : ",\n").append(String.format("    [%s, %s, %s, %d, %d, %d]", hue, saturation, brightness, (rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff));
			first = false;
		}
		out.append("\n  ]\n}\n");
		System.out.print(out);
	}
}
