"""Setup configuration for semantic-layer-sync"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="semantic-layer-sync",
    version="1.0.0",
    author="Treasure Data",
    description="Automate metadata population in Treasure Data with heuristic-based description generation",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/treasure-data/td-skills",
    packages=find_packages(exclude=["tests"]),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Database",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "pyyaml>=6.0",
        "pytd>=1.5.0",
        "requests>=2.28.0",
    ],
    entry_points={
        "console_scripts": [
            "semantic-layer-sync=semantic_layer_sync:main",
        ],
    },
    include_package_data=True,
    keywords="treasure-data metadata schema documentation",
)
