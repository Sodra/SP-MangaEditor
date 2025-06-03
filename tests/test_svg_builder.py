import os
import sys
import tempfile
import unittest

# Adjust path to import SvgBuilder
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '01_build'))

from SvgBuilder import generate_js_svg_array

class TestSvgBuilder(unittest.TestCase):
    def test_generate_js_svg_array(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            svg_dir = os.path.join(tmpdir, 'svg')
            os.makedirs(svg_dir)
            sample_svg_path = os.path.join(svg_dir, 'sample.svg')
            with open(sample_svg_path, 'w', encoding='utf-8') as f:
                f.write('<svg><rect width="10" height="10"/></svg>')

            output_js = os.path.join(tmpdir, 'output.js')
            generate_js_svg_array(svg_dir, output_js, 'testArray')

            self.assertTrue(os.path.exists(output_js), 'JS output file not created')
            with open(output_js, 'r', encoding='utf-8') as f:
                content = f.read()
            self.assertIn('name: "sample"', content)

if __name__ == '__main__':
    unittest.main()
