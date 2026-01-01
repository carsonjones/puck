class Puck < Formula
  desc "NHL Terminal UI for real-time stats and game tracking"
  homepage "https://github.com/carsonjones/puck"
  url "https://registry.npmjs.org/@jonze/puck/-/puck-0.1.0.tgz"
  sha256 "4a9f145ecb02db5cd81296f05161c0c42f1471cecf90372dfc0a2c41d7ec977e"
  license "MIT"

  depends_on "bun"

  def install
    # npm tarball extracts to package/
    libexec.install Dir["package/*"]
    bin.install_symlink libexec/"dist/index.js" => "puck"
  end

  test do
    system bin/"puck", "--skip-version-check", "--help"
  end
end
